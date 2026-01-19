# GDPR Compliance Documentation

**Last Updated:** January 2025  
**Data Controller:** XpenseLab  
**Contact:** info@xpenselab.com

---

## Table of Contents

1. [Overview](#overview)
2. [Legal Basis for Processing](#legal-basis-for-processing)
3. [Data We Collect](#data-we-collect)
4. [How We Use Your Data](#how-we-use-your-data)
5. [Data Protection Measures](#data-protection-measures)
6. [Your Rights Under GDPR](#your-rights-under-gdpr)
7. [Data Retention](#data-retention)
8. [Third-Party Processors](#third-party-processors)
9. [Data Transfers](#data-transfers)
10. [Cookies and Tracking](#cookies-and-tracking)
11. [Data Breach Notification](#data-breach-notification)
12. [Contact Information](#contact-information)

---

## 1. Overview

XpenseLab is committed to protecting your personal data and ensuring compliance with the General Data Protection Regulation (GDPR) (EU) 2016/679. This document outlines how we collect, process, store, and protect your personal information when you use our personal finance management application.

### What is GDPR?

The GDPR is a European Union regulation that governs data protection and privacy for individuals within the EU and EEA. It gives you control over your personal data and requires organizations to be transparent about how they collect and use your information.

---

## 2. Legal Basis for Processing

We process your personal data based on the following legal grounds under GDPR Article 6:

1. **Consent (Article 6(1)(a))**: When you explicitly consent to data processing (e.g., optional analytics, marketing communications)
2. **Contractual Necessity (Article 6(1)(b))**: To provide you with our financial tracking services as outlined in our Terms of Service
3. **Legitimate Interests (Article 6(1)(f))**: For security, fraud prevention, and service improvement (where your rights and freedoms do not override our interests)
4. **Legal Obligation (Article 6(1)(c))**: To comply with legal requirements (e.g., tax reporting, financial regulations)

---

## 3. Data We Collect

### 3.1 Personal Identification Data

- **Account Information**: Email address, display name, profile picture (if provided)
- **Authentication Data**: OAuth provider information (Google, GitHub), authentication tokens
- **User Preferences**: Currency settings, theme preferences, notification settings

### 3.2 Financial Data

- **Income Records**: Amount, date, description, category, source
- **Expense Records**: Amount, date, description, category, merchant information
- **Budget Information**: Monthly budgets, budget categories, spending limits
- **Transaction History**: Historical financial transactions imported from CSV/XLSX files
- **Bank Integration Data**: 
  - Monzo: Transaction data, account balances (via OAuth2)
  - SaltEdge: Bank account information, transaction data (if enabled)

### 3.3 Shared Finance Data

- **Group Information**: Group names, member emails, group expenses
- **Expense Splitting**: Who paid, how expenses are split among group members
- **Debt Records**: One-on-one debts, repayment history
- **Loan Information**: Loan amounts, repayment schedules, interest rates

### 3.4 Technical Data

- **Device Information**: Browser type, operating system, device identifiers
- **Usage Data**: Pages visited, features used, time spent in application
- **Performance Metrics**: Core Web Vitals (CLS, LCP, INP, FCP, TTFB) for service improvement
- **Error Logs**: Application errors, network failures (sanitized, no sensitive data)

### 3.5 AI Processing Data

- **Expense Categorization**: Expense descriptions sent to Genkit AI for automatic categorization
- **AI-Generated Insights**: Financial analysis and recommendations based on your data

### 3.6 Encryption Data

- **Encryption Metadata**: Encryption salt (stored in Firestore for cross-browser compatibility)
- **Recovery Codes**: Hashed recovery codes for encryption key recovery (stored securely)
- **Note**: Your encryption code/password is NEVER stored. It is only used client-side to derive encryption keys.

---

## 4. How We Use Your Data

### 4.1 Core Service Functions

- **Financial Tracking**: Store and display your income, expenses, budgets, and financial goals
- **AI Categorization**: Automatically categorize expenses using Genkit AI based on transaction descriptions
- **Budget Management**: Track spending against budgets and provide visual progress indicators
- **Data Analysis**: Generate insights, forecasts, and reports based on your financial data
- **Bank Integration**: Import transactions from connected bank accounts (Monzo, SaltEdge)

### 4.2 Service Improvement

- **Performance Monitoring**: Track Core Web Vitals and application performance to improve user experience
- **Error Detection**: Monitor and fix application errors to ensure service reliability
- **Feature Development**: Analyze usage patterns to develop new features and improve existing ones

### 4.3 Security and Fraud Prevention

- **Authentication**: Verify your identity and secure access to your account
- **Fraud Detection**: Monitor for suspicious activity and unauthorized access attempts
- **Data Encryption**: Encrypt sensitive financial data at rest using client-side encryption

### 4.4 Legal Compliance

- **Tax Reporting**: Provide data export capabilities for tax reporting purposes
- **Regulatory Compliance**: Comply with financial regulations and data protection laws

---

## 5. Data Protection Measures

### 5.1 Encryption

- **Client-Side Encryption**: Financial data is encrypted using AES-GCM (256-bit) before storage
- **Key Derivation**: Encryption keys are derived using PBKDF2 (100,000 iterations) from your encryption code
- **Encryption at Rest**: All sensitive financial data stored in Firestore is encrypted
- **Encryption in Transit**: All data transmitted between your device and our servers uses TLS/HTTPS

### 5.2 Access Controls

- **Authentication**: Secure authentication via Firebase Authentication (OAuth2 with Google/GitHub)
- **Authorization**: Firestore Security Rules ensure users can only access their own data
- **Session Management**: Secure session tokens, automatic logout on inactivity

### 5.3 Infrastructure Security

- **Firebase Security**: Data stored in Google Firebase with enterprise-grade security
- **Firebase App Check**: Protection against abuse and unauthorized access
- **Regular Security Audits**: Ongoing security reviews and vulnerability assessments

### 5.4 Data Minimization

- **Minimal Data Collection**: We only collect data necessary for service functionality
- **No Unnecessary Tracking**: We do not track users across websites or use invasive tracking technologies
- **Sanitized Logging**: Error logs and performance metrics exclude sensitive information

### 5.5 Backup and Recovery

- **Point-in-Time Recovery**: Firestore PITR enabled for 7-day data recovery window
- **Regular Backups**: Automated backups ensure data availability and recovery

---

## 6. Your Rights Under GDPR

As a data subject under GDPR, you have the following rights:

### 6.1 Right of Access (Article 15)

You have the right to access all personal data we hold about you. You can:
- View your data directly in the application
- Export your financial data (CSV/XLSX format) from the Settings page
- Request a complete data export by contacting us

### 6.2 Right to Rectification (Article 16)

You can correct inaccurate or incomplete data:
- Edit income/expense records directly in the application
- Update your profile information in Settings
- Modify categories, budgets, and other user-generated content

### 6.3 Right to Erasure ("Right to be Forgotten") (Article 17)

You can request deletion of your personal data:
- **Delete Account**: Use the "Reset Data" feature in Settings to delete all your data
- **Selective Deletion**: Delete individual transactions, categories, or budgets
- **Complete Deletion**: Contact us to request complete account and data deletion

**Note**: Some data may be retained for legal compliance (e.g., financial records required by law) or legitimate business interests (e.g., fraud prevention).

### 6.4 Right to Restrict Processing (Article 18)

You can request that we limit how we process your data:
- Disable encryption to prevent automatic processing of encrypted data
- Opt out of optional features (e.g., AI categorization, analytics)
- Contact us to request processing restrictions

### 6.5 Right to Data Portability (Article 20)

You can receive your data in a structured, commonly used format:
- **Export Functionality**: Export all financial data as CSV/XLSX from Settings
- **API Access**: Request API access to your data (contact us for details)
- **Data Transfer**: Receive your data in a machine-readable format for transfer to another service

### 6.6 Right to Object (Article 21)

You can object to processing based on legitimate interests:
- Opt out of performance monitoring (via `NEXT_PUBLIC_DISABLE_MONITORING` environment variable)
- Disable optional analytics and tracking
- Object to AI processing of your data (disable AI categorization)

### 6.7 Rights Related to Automated Decision-Making (Article 22)

- **AI Categorization**: You can review and modify AI-suggested categories
- **Manual Override**: All AI suggestions can be manually changed
- **No Automated Profiling**: We do not use automated decision-making that significantly affects you

### 6.8 Right to Withdraw Consent (Article 7(3))

You can withdraw consent at any time:
- Revoke bank account connections (Monzo, SaltEdge) in Settings
- Disable optional features that require consent
- Update cookie preferences via the cookie consent banner

### 6.9 How to Exercise Your Rights

To exercise any of these rights:
1. **In-App**: Use the Settings page for most data management tasks
2. **Email**: Contact us at [Your Contact Email] with your request
3. **Response Time**: We will respond within 30 days (as required by GDPR)

---

## 7. Data Retention

### 7.1 Active Accounts

- **Financial Data**: Retained for as long as your account is active
- **Transaction History**: Retained indefinitely unless you delete it
- **User Preferences**: Retained until you change or delete them

### 7.2 Deleted Accounts

- **Immediate Deletion**: Most data is deleted immediately upon account deletion
- **Backup Retention**: Data in backups may be retained for up to 7 days (Firestore PITR window)
- **Legal Retention**: Some data may be retained longer if required by law

### 7.3 Encrypted Data

- **Encrypted Financial Data**: Retained until you delete it or disable encryption
- **Encryption Metadata**: Retained until encryption is disabled or account is deleted
- **Recovery Codes**: Retained until encryption is disabled or regenerated

### 7.4 Logs and Analytics

- **Error Logs**: Retained for 90 days for debugging and service improvement
- **Performance Metrics**: Aggregated data retained for 1 year
- **No Personal Data**: Logs are sanitized and do not contain personal information

---

## 8. Third-Party Processors

We use the following third-party services to provide our application:

### 8.1 Google Firebase (Data Processor)

- **Purpose**: Authentication, database storage, hosting
- **Data Processed**: All user data, authentication tokens, financial data
- **Location**: United States (with EU Standard Contractual Clauses)
- **GDPR Compliance**: Firebase complies with GDPR and provides data processing agreements
- **Privacy Policy**: https://firebase.google.com/support/privacy

### 8.2 Google Cloud / Genkit AI (Data Processor)

- **Purpose**: AI-powered expense categorization
- **Data Processed**: Expense descriptions (sent for categorization only)
- **Location**: United States (with EU Standard Contractual Clauses)
- **GDPR Compliance**: Google Cloud complies with GDPR
- **Privacy Policy**: https://cloud.google.com/security/privacy

### 8.3 Monzo (Bank Integration)

- **Purpose**: Import transactions from Monzo bank accounts
- **Data Processed**: Transaction data, account balances (via OAuth2)
- **Location**: United Kingdom (GDPR compliant)
- **GDPR Compliance**: Monzo is GDPR compliant
- **Privacy Policy**: https://monzo.com/privacy

### 8.4 SaltEdge (Bank Integration)

- **Purpose**: Connect to multiple bank accounts and import transactions
- **Data Processed**: Bank account information, transaction data
- **Location**: Canada (with appropriate safeguards)
- **GDPR Compliance**: SaltEdge provides GDPR-compliant services
- **Privacy Policy**: https://www.saltedge.com/privacy_policy

### 8.5 Data Processing Agreements

All third-party processors have signed Data Processing Agreements (DPAs) that comply with GDPR Article 28 requirements.

---

## 9. Data Transfers

### 9.1 International Transfers

Your data may be transferred to and processed in countries outside the EU/EEA:
- **United States**: Firebase, Google Cloud services
- **United Kingdom**: Monzo (post-Brexit, with appropriate safeguards)
- **Canada**: SaltEdge (with adequacy decision)

### 9.2 Safeguards

We ensure adequate safeguards for international transfers:
- **Standard Contractual Clauses (SCCs)**: Used for transfers to the United States
- **Adequacy Decisions**: Countries with EU adequacy decisions (e.g., Canada)
- **Binding Corporate Rules**: Where applicable, processors follow binding corporate rules

---

## 10. Cookies and Tracking

### 10.1 Essential Cookies

These cookies are necessary for the application to function:

- **Authentication Cookies**: Firebase Authentication session tokens
- **Security Cookies**: Firebase App Check tokens
- **Functional Cookies**: Sidebar state preferences, theme preferences

**Legal Basis**: Contractual necessity (Article 6(1)(b))

### 10.2 Analytics Cookies (Optional)

- **Performance Monitoring**: Core Web Vitals tracking (can be disabled)
- **Error Tracking**: Application error monitoring (sanitized, no personal data)

**Legal Basis**: Consent (Article 6(1)(a)) - You can opt out

### 10.3 Cookie Consent

- **Consent Banner**: Displayed on first visit to obtain consent for non-essential cookies
- **Cookie Preferences**: Manage cookie preferences at any time
- **Withdrawal**: You can withdraw consent and disable cookies via Settings

### 10.4 Third-Party Cookies

We do not use third-party advertising cookies or tracking pixels. We do not share your data with advertising networks.

---

## 11. Data Breach Notification

### 11.1 Our Commitment

In the event of a data breach that poses a risk to your rights and freedoms, we will:

1. **Notify Supervisory Authority**: Report to the relevant Data Protection Authority within 72 hours
2. **Notify Affected Users**: Inform affected users without undue delay
3. **Provide Details**: Explain the nature of the breach, data affected, and mitigation steps

### 11.2 Security Measures

We implement multiple layers of security to prevent breaches:
- Encryption at rest and in transit
- Access controls and authentication
- Regular security audits
- Monitoring and intrusion detection

---

## 12. Contact Information

### 12.1 Data Protection Officer (DPO)

If you have questions about data protection or wish to exercise your rights:

**Email**: [Your Contact Email]  
**Subject Line**: "GDPR Request - [Your Request Type]"

### 12.2 Supervisory Authority

If you believe we have not addressed your concerns, you can file a complaint with your local Data Protection Authority:

- **UK**: Information Commissioner's Office (ICO) - https://ico.org.uk
- **EU**: Your local Data Protection Authority - https://edpb.europa.eu/about-edpb/board/members_en

### 12.3 Response Times

- **General Inquiries**: Within 7 business days
- **GDPR Requests**: Within 30 days (as required by GDPR)
- **Data Breach Notifications**: Within 72 hours (as required by GDPR)

---

## Appendix A: Data Processing Activities

### A.1 Data Categories and Purposes

| Data Category | Purpose | Legal Basis | Retention Period |
|--------------|---------|-------------|-----------------|
| Email Address | Account creation, authentication | Contractual necessity | Until account deletion |
| Financial Transactions | Core service functionality | Contractual necessity | Until user deletion |
| Bank Integration Data | Transaction import | Consent | Until connection revoked |
| AI Processing Data | Expense categorization | Contractual necessity | Processed in real-time, not stored |
| Performance Metrics | Service improvement | Legitimate interests | 1 year (aggregated) |
| Error Logs | Debugging, security | Legitimate interests | 90 days (sanitized) |

### A.2 Data Subject Rights Matrix

| Right | How to Exercise | Response Time | Restrictions |
|-------|----------------|---------------|--------------|
| Access | Settings > Export Data or contact us | 30 days | None |
| Rectification | Edit data in-app | Immediate | None |
| Erasure | Settings > Reset Data or contact us | 30 days | Legal retention requirements |
| Portability | Settings > Export Data | 30 days | None |
| Restrict Processing | Contact us | 30 days | May affect service functionality |
| Object | Disable features in Settings | Immediate | May affect service functionality |
| Withdraw Consent | Cookie banner or Settings | Immediate | None |

---

## Appendix B: Technical Security Measures

### B.1 Encryption Specifications

- **Algorithm**: AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Key Size**: 256 bits
- **Key Derivation**: PBKDF2 (Password-Based Key Derivation Function 2)
- **Iterations**: 100,000 iterations
- **Salt Length**: 16 bytes (128 bits)
- **IV Length**: 12 bytes (96 bits) for GCM

### B.2 Authentication

- **Provider**: Firebase Authentication
- **Methods**: OAuth2 (Google, GitHub)
- **Session Management**: Secure tokens, automatic expiration
- **Multi-Factor Authentication**: Supported (via Firebase)

### B.3 Network Security

- **Protocol**: HTTPS/TLS 1.2+
- **Certificate**: Valid SSL/TLS certificates
- **Firewall**: Cloud-based firewall protection
- **DDoS Protection**: Firebase DDoS protection enabled

---

## Changes to This Policy

We may update this GDPR Compliance documentation from time to time. We will:

1. **Notify Users**: Inform you of significant changes via email or in-app notification
2. **Update Date**: Update the "Last Updated" date at the top of this document
3. **Version History**: Maintain a version history of changes

**Last Updated**: January 2025

---

**This document is part of our commitment to transparency and GDPR compliance. If you have any questions or concerns, please contact us.**
