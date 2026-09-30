import os

file_path = "/home/anv/Documents/A2Order/apps/cms/src/features/cms/components/superAdmin/LicenseManager.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_block(start_marker, end_marker=None):
    start_idx = -1
    for i, line in enumerate(lines):
        if start_marker in line:
            start_idx = i
            break
    if start_idx == -1:
        return -1, -1, ""
    
    open_braces = 0
    open_tags = 0
    end_idx = start_idx
    started = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        open_braces += line.count('{') - line.count('}')
        open_tags += line.count('<div') - line.count('</div')
        if line.count('<div') > 0:
            started = True
        if started and open_braces == 0 and open_tags == 0:
            end_idx = i
            break
    return start_idx, end_idx, "".join(lines[start_idx:end_idx+1])

d_start, d_end, d_block = get_block('<div className="hidden lg:block overflow-x-auto">')
print("Desktop:", d_start, d_end)

m_start, m_end, m_block = get_block('<div className="block lg:hidden">')
print("Mobile:", m_start, m_end)

desktop_code = """import React from "react";
import { Icon } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseDesktopTableProps {
  paginatedLicenses: LicenseKeyRecord[];
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseDesktopTable: React.FC<LicenseDesktopTableProps> = ({
  paginatedLicenses,
  handleCopyKey,
  handleRevokeKey,
}) => {
  return (
""" + "    " + "\n".join(d_block.split("\n")) + """
  );
};
"""

with open(os.path.join(os.path.dirname(file_path), "LicenseDesktopTable.tsx"), "w", encoding="utf-8") as f:
    f.write(desktop_code)

mobile_code = """import React from "react";
import { Icon } from "@/components/ui";
import { LicenseKeyRecord } from "./superAdminMockData";

export interface LicenseMobileCardsProps {
  paginatedLicenses: LicenseKeyRecord[];
  handleCopyKey: (key: string) => void;
  handleRevokeKey: (lic: LicenseKeyRecord) => void;
}

export const LicenseMobileCards: React.FC<LicenseMobileCardsProps> = ({
  paginatedLicenses,
  handleCopyKey,
  handleRevokeKey,
}) => {
  return (
""" + "    " + "\n".join(m_block.split("\n")) + """
  );
};
"""

with open(os.path.join(os.path.dirname(file_path), "LicenseMobileCards.tsx"), "w", encoding="utf-8") as f:
    f.write(mobile_code)

# Replace in original file
new_lines = lines[:d_start] + [
    '            <LicenseDesktopTable\n',
    '              paginatedLicenses={paginatedLicenses}\n',
    '              handleCopyKey={handleCopyKey}\n',
    '              handleRevokeKey={handleRevokeKey}\n',
    '            />\n'
] + lines[d_end+1:m_start] + [
    '            <LicenseMobileCards\n',
    '              paginatedLicenses={paginatedLicenses}\n',
    '              handleCopyKey={handleCopyKey}\n',
    '              handleRevokeKey={handleRevokeKey}\n',
    '            />\n'
] + lines[m_end+1:]

imports = """
import { LicenseDesktopTable } from "./LicenseDesktopTable";
import { LicenseMobileCards } from "./LicenseMobileCards";
"""
final_code = imports + "".join(new_lines).replace(
    'import { LicenseKeyRecord } from "@/types/cms.types";', 
    'import { LicenseKeyRecord } from "./superAdminMockData";'
)
with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_code)

