'use client';

import { DashboardHeader } from '@/components/shared/dashboard-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Lock, Eye, Trash2, Download, Ban, AlertCircle, Mail, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <DashboardHeader title="Privacy & GDPR Compliance" />

      <div className="space-y-6">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Privacy Matters
            </CardTitle>
            <CardDescription>
              XpenseLab is committed to protecting your personal data and ensuring full compliance with GDPR.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This page provides an overview of how we handle your data, your rights under GDPR, and our data protection measures.
              For complete details, please refer to our{' '}
              <Link href="/docs/GDPR_COMPLIANCE.md" className="underline hover:text-foreground" target="_blank">
                full GDPR Compliance Documentation
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/docs/GDPR_COMPLIANCE.md" target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Documentation
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="mailto:tushar@xpenselab.com?subject=GDPR Request">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact DPO
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rights">Your Rights</TabsTrigger>
            <TabsTrigger value="data">Data Protection</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What Data We Collect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Personal Information</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Email address and display name</li>
                      <li>Authentication information (OAuth providers)</li>
                      <li>User preferences and settings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Financial Data</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Income and expense records</li>
                      <li>Budget information</li>
                      <li>Transaction history</li>
                      <li>Bank integration data (if connected)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Technical Data</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Performance metrics (Core Web Vitals)</li>
                      <li>Error logs (sanitized, no personal data)</li>
                      <li>Usage statistics</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>We use your data to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Provide core financial tracking services</li>
                    <li>Automatically categorize expenses using AI</li>
                    <li>Generate insights and forecasts</li>
                    <li>Import transactions from connected bank accounts</li>
                    <li>Improve application performance and reliability</li>
                    <li>Ensure security and prevent fraud</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Legal Basis for Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>We process your data based on:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Contractual Necessity:</strong> To provide our financial tracking services</li>
                    <li><strong>Consent:</strong> For optional features like analytics and bank integrations</li>
                    <li><strong>Legitimate Interests:</strong> For security, fraud prevention, and service improvement</li>
                    <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Your Rights Tab */}
          <TabsContent value="rights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Your GDPR Rights
                </CardTitle>
                <CardDescription>
                  You have comprehensive rights over your personal data under GDPR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="access">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Right of Access
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can access all personal data we hold about you:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>View your data directly in the application</li>
                          <li>Export your financial data (CSV/XLSX) from Settings</li>
                          <li>Request a complete data export by contacting us</li>
                        </ul>
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/settings">Go to Settings</Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="rectification">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Right to Rectification
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can correct inaccurate or incomplete data:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Edit income/expense records directly in the application</li>
                          <li>Update your profile information in Settings</li>
                          <li>Modify categories, budgets, and other user-generated content</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="erasure">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Right to Erasure ("Right to be Forgotten")
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can request deletion of your personal data:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Delete individual transactions, categories, or budgets</li>
                          <li>Use the "Reset Data" feature in Settings to delete all your data</li>
                          <li>Contact us to request complete account deletion</li>
                        </ul>
                        <div className="pt-2">
                          <Button variant="destructive" size="sm" asChild>
                            <Link href="/settings">Delete Data</Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="portability">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Right to Data Portability
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can receive your data in a structured, machine-readable format:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Export all financial data as CSV/XLSX from Settings</li>
                          <li>Request API access to your data (contact us)</li>
                          <li>Transfer your data to another service</li>
                        </ul>
                        <div className="pt-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/settings">Export Data</Link>
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="object">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Right to Object
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can object to processing based on legitimate interests:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Opt out of performance monitoring</li>
                          <li>Disable optional analytics and tracking</li>
                          <li>Object to AI processing of your data</li>
                        </ul>
                        <p className="pt-2">
                          You can manage these preferences in Settings or via the cookie consent banner.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="withdraw">
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Right to Withdraw Consent
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>You can withdraw consent at any time:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Revoke bank account connections in Settings</li>
                          <li>Disable optional features that require consent</li>
                          <li>Update cookie preferences via the cookie consent banner</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Exercise Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">In-App Methods</h4>
                    <p className="text-muted-foreground">
                      Most data management tasks can be performed directly in the application via the Settings page.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Contact Us</h4>
                    <p className="text-muted-foreground mb-2">
                      For requests that cannot be handled in-app, contact us at:
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <a href="mailto:tushar@xpenselab.com?subject=GDPR Request">
                        <Mail className="h-4 w-4 mr-2" />
                        tushar@xpenselab.com
                      </a>
                    </Button>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Response Time</h4>
                    <p className="text-muted-foreground">
                      We will respond to your requests within 30 days as required by GDPR.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Protection Tab */}
          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Protection Measures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Encryption</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li><strong>Client-Side Encryption:</strong> Financial data encrypted using AES-GCM (256-bit) before storage</li>
                      <li><strong>Key Derivation:</strong> PBKDF2 with 100,000 iterations</li>
                      <li><strong>Encryption at Rest:</strong> All sensitive data stored encrypted in Firestore</li>
                      <li><strong>Encryption in Transit:</strong> TLS/HTTPS for all data transmission</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Access Controls</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Secure authentication via Firebase Authentication (OAuth2)</li>
                      <li>Firestore Security Rules ensure users can only access their own data</li>
                      <li>Secure session management with automatic logout</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Infrastructure Security</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Enterprise-grade security via Google Firebase</li>
                      <li>Firebase App Check protection against abuse</li>
                      <li>Regular security audits and vulnerability assessments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Third-Party Processors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Google Firebase</h4>
                    <p className="text-muted-foreground">
                      Authentication, database storage, hosting. All data processing agreements comply with GDPR.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Google Cloud / Genkit AI</h4>
                    <p className="text-muted-foreground">
                      AI-powered expense categorization. Only expense descriptions are sent for processing.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    All third-party processors have signed Data Processing Agreements (DPAs) that comply with GDPR Article 28.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Active Accounts:</strong> Data retained for as long as your account is active</p>
                  <p><strong>Deleted Accounts:</strong> Most data deleted immediately; backups retained for up to 7 days</p>
                  <p><strong>Logs:</strong> Error logs retained for 90 days; performance metrics for 1 year (aggregated, no personal data)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cookies Tab */}
          <TabsContent value="cookies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cookie Policy</CardTitle>
                <CardDescription>
                  We use cookies to enhance your experience and improve our services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Essential Cookies</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Required for the application to function. These cannot be disabled.
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Authentication cookies (Firebase session tokens)</li>
                      <li>Security cookies (Firebase App Check tokens)</li>
                      <li>Functional cookies (sidebar state, theme preferences)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Analytics Cookies (Optional)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Help us understand how visitors use our website. You can opt out.
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Performance monitoring (Core Web Vitals)</li>
                      <li>Error tracking (sanitized, no personal data)</li>
                    </ul>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      // Trigger cookie consent dialog
                      localStorage.removeItem('xpenselab_cookie_consent');
                      window.location.reload();
                    }}>
                      Manage Cookie Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Data Protection Officer</h4>
                <p className="text-muted-foreground mb-2">
                  For questions about data protection or to exercise your rights:
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:tushar@xpenselab.com?subject=GDPR Request">
                    <Mail className="h-4 w-4 mr-2" />
                    tushar@xpenselab.com
                  </a>
                </Button>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Supervisory Authority</h4>
                <p className="text-muted-foreground mb-2">
                  If you believe we have not addressed your concerns, you can file a complaint with your local Data Protection Authority:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>
                    <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      UK: Information Commissioner's Office (ICO)
                    </a>
                  </li>
                  <li>
                    <a href="https://edpb.europa.eu/about-edpb/board/members_en" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                      EU: European Data Protection Board
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
