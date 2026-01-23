# Security Vulnerabilities & Mitigations

This document tracks known security vulnerabilities in dependencies and the mitigations applied.

## Current Vulnerabilities

### 1. @capacitor/cli - tar dependency (CVE-2021-*)

**Status**: ⚠️ Low Priority (Windows)

**Details**:
- Vulnerability in `tar` dependency used by `@capacitor/cli`
- Affects macOS APFS file system (race condition via Unicode ligature collisions)
- **Risk Level**: Low on Windows systems (vulnerability is macOS-specific)
- **Impact**: Potential arbitrary code execution during npm package extraction

**Mitigation**:
- Currently using Capacitor 8.0.1 (latest stable)
- Vulnerability is in transitive dependency (`tar`)
- Monitor for Capacitor updates that address this
- Consider using `npm audit fix` when a non-breaking fix is available

**Action Items**:
- [ ] Monitor Capacitor releases for tar dependency updates
- [ ] Review when Capacitor 8.1+ is released
- [ ] Consider alternative if fix is delayed

**References**:
- [GitHub Security Advisory](https://github.com/advisories/GHSA-r6q2-hw4h-h46w)
- [Capacitor Releases](https://github.com/ionic-team/capacitor/releases)

---

### 2. xlsx (SheetJS) - Prototype Pollution & ReDoS

**Status**: ⚠️ Medium Priority (Mitigated)

**Details**:
- **Prototype Pollution** (GHSA-4r6h-8v6p-xvw6): Potential for prototype chain manipulation
- **ReDoS** (GHSA-5pgg-2g8v-p4x9): Regular Expression Denial of Service vulnerability
- **Impact**: 
  - Prototype pollution could lead to code execution
  - ReDoS could cause application hang/crash with malicious input
- **No fix available** from maintainers

**Mitigations Applied**:

1. **File Size Limits**:
   - Maximum file size: 10MB
   - Prevents extremely large files that could trigger ReDoS

2. **File Type Validation**:
   - Only allows: `.xlsx`, `.xls`, `.csv`, `.tsv`
   - Validates file extension before processing

3. **Row/Column Limits**:
   - Maximum rows: 10,000
   - Maximum columns: 100
   - Prevents memory exhaustion and limits ReDoS attack surface

4. **Input Sanitization**:
   - Limits XLSX parsing options (`cellNF: false`, `cellStyles: false`)
   - Restricts to first sheet only
   - Uses safe parsing options (`raw: false`, `defval: null`)

5. **Range Limiting**:
   - Explicitly limits the cell range processed
   - Prevents processing of unexpectedly large worksheets

**Code Location**: `src/components/settings/data-importer.tsx`

**Action Items**:
- [x] Added file size validation
- [x] Added file type validation
- [x] Added row/column limits
- [x] Added input sanitization
- [ ] Consider migrating to `exceljs` if vulnerabilities persist
- [ ] Monitor for xlsx updates that address vulnerabilities
- [ ] Review user-reported issues related to file imports

**Alternative Solutions** (if needed):
1. **exceljs**: More actively maintained, but lacks formal security policy
2. **read-excel-file**: Lightweight, read-only, but less feature-rich
3. **CSV-only approach**: Simplest, but loses Excel format support

**References**:
- [Prototype Pollution Advisory](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
- [ReDoS Advisory](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)
- [SheetJS Security Documentation](https://docs.sheetjs.com/docs/miscellany/security)

---

## General Security Best Practices

### Dependency Management
- Run `npm audit` regularly
- Review security advisories before updating
- Prefer packages with active maintenance and security policies
- Use `npm audit fix` for non-breaking fixes only

### File Upload Security
- Always validate file types and sizes
- Limit processing to reasonable bounds
- Sanitize all user input
- Use timeouts for long-running operations
- Log security-related events

### Monitoring
- Review this document monthly
- Check for dependency updates weekly
- Monitor npm security advisories
- Review application logs for suspicious activity

---

## Update History

- **2025-01-23**: Documented xlsx and Capacitor vulnerabilities, added mitigations for xlsx
