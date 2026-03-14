#!/usr/bin/env node
/**
 * AI-Driven Terraform Security Remediation
 * Uses Gemini 2.5 Flash API with tool calling to automatically fix
 * Trivy-identified vulnerabilities in Terraform files.
 *
 * Usage:
 *   GEMINI_API_KEY=xxx ADMIN_IP=1.2.3.4 node ai-remediation.js
 *
 * Env vars:
 *   GEMINI_API_KEY  - Required. Your Gemini API key.
 *   ADMIN_IP       - Optional. Your IP for SSH restriction (e.g. 203.0.113.50).
 *                    If omitted, uses YOUR_ADMIN_IP placeholder.
 *   REPORT_FILE    - Trivy report path (default: trivy-report.txt)
 *   TERRAFORM_DIR  - Terraform directory (default: ../terraform)
 */

import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ADMIN_IP = process.env.ADMIN_IP || 'YOUR_ADMIN_IP';
// Use WORKSPACE (Jenkins) or current dir when run from repo root
const WORKSPACE_ROOT = process.env.WORKSPACE || process.cwd();
const REPORT_FILE = path.resolve(WORKSPACE_ROOT, process.env.REPORT_FILE || 'trivy-report.txt');
const TERRAFORM_DIR = path.resolve(WORKSPACE_ROOT, process.env.TERRAFORM_DIR || 'WhizSuite/terraform');

const APPLICABLE_FILES = ['security_groups.tf', 'ec2.tf'];

const applyTerraformFixDeclaration = {
  name: 'apply_terraform_fix',
  description: 'Apply a security fix to a Terraform file. Call this for each file that needs to be modified to address the Trivy findings. Provide the complete corrected file content.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Relative path to the Terraform file (e.g. security_groups.tf or ec2.tf)',
      },
      new_content: {
        type: 'string',
        description: 'The complete corrected Terraform file content that fixes the vulnerability',
      },
      description: {
        type: 'string',
        description: 'Brief description of the fix applied',
      },
    },
    required: ['file_path', 'new_content', 'description'],
  },
};

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    return null;
  }
}

function applyTerraformFix(args) {
  const { file_path, new_content, description } = args;
  const fullPath = path.join(TERRAFORM_DIR, file_path);
  if (!APPLICABLE_FILES.includes(file_path)) {
    return { success: false, error: `Invalid file: ${file_path}. Allowed: ${APPLICABLE_FILES.join(', ')}` };
  }
  try {
    fs.writeFileSync(fullPath, new_content, 'utf8');
    console.log(`[AI Remediation] Applied fix to ${file_path}: ${description}`);
    return { success: true, file: file_path, description };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.log('[AI Remediation] GEMINI_API_KEY not set – skipping. Add it in Jenkins to enable AI fixes.');
    process.exit(0);
  }

  const report = readFileSafe(REPORT_FILE);
  if (!report) {
    console.error(`ERROR: Could not read Trivy report from ${REPORT_FILE}`);
    process.exit(1);
  }
  if (/Misconfigurations\s*\|\s*0\s*\|/.test(report) || report.includes('Clean (no security findings')) {
    console.log('[AI Remediation] Trivy report shows 0 findings – skipping (no fixes needed).');
    process.exit(0);
  }

  const tfFiles = {};
  for (const f of APPLICABLE_FILES) {
    const content = readFileSafe(path.join(TERRAFORM_DIR, f));
    if (content) tfFiles[f] = content;
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const systemPrompt = `You are a DevOps security expert. You have received a Trivy IaC security scan report for Terraform files.
Your task is to fix ALL vulnerabilities found by Trivy. Use the apply_terraform_fix tool to apply each fix.

Common findings and fixes:
1. AVD-AWS-0107 / aws-ec2-no-public-ingress-sgr: SSH (port 22) open to 0.0.0.0/0 is insecure. Restrict cidr_blocks to a valid CIDR. Use ["10.0.0.1/32"] if ADMIN_IP not set - NEVER use literal "ADMIN_IP/32" or "YOUR_ADMIN_IP/32" (invalid).
2. AVD-AWS-0131 / aws-ebs-encryption: EBS root_block_device must have encrypted = true. Add encrypted = true to root_block_device.

CRITICAL: Terraform and AWS require valid values. Use ONLY valid CIDR (e.g. 10.0.0.1/32), and description must match regex [0-9A-Za-z_ .:/()#,@+=&;{}!$*-] - use ASCII hyphen (-) NOT em dash.
Preserve all other Terraform structure. Output valid Terraform HCL.
Apply fixes for every vulnerability in the report. Call apply_terraform_fix for each file that needs changes.`;

  const userPrompt = `Trivy Security Scan Report:
${report}

Current Terraform files:
${Object.entries(tfFiles)
  .map(([name, content]) => `--- ${name} ---\n${content}`)
  .join('\n\n')}

Fix all vulnerabilities listed in the Trivy report. Use the apply_terraform_fix tool for each modified file.`;

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'user', parts: [{ text: userPrompt }] },
  ];

  let round = 0;
  const maxRounds = 5;

  while (round < maxRounds) {
    round++;
    console.log(`[AI Remediation] Gemini round ${round}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: ['apply_terraform_fix'],
          },
        },
        tools: [{ functionDeclarations: [applyTerraformFixDeclaration] }],
      },
    });

    const fc = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall)?.[0]?.functionCall;
    if (!fc || fc.name !== 'apply_terraform_fix') {
      const text = response.text?.() ?? response.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
      if (text) console.log('[AI Remediation]', text);
      if (round === 1 && !fc) {
        console.log('[AI Remediation] No function call returned. Exiting.');
        process.exit(1);
      }
      break;
    }

    const result = applyTerraformFix(fc.args);
    contents.push(
      { role: 'model', parts: [{ functionCall: { name: fc.name, args: fc.args } }] },
      {
        role: 'user',
        parts: [{ functionResponse: { name: fc.name, response: result } }],
      }
    );
  }

  console.log('[AI Remediation] Done. Re-run Trivy to verify fixes.');
}

main().catch((err) => {
  console.error('[AI Remediation] Error:', err.message);
  process.exit(1);
});
