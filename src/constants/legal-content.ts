import { LegalSectionContent, TermsSectionKey } from '../types';

export const LEGAL_LAST_UPDATED = 'May 6, 2026';

export const LEGAL_SECTION_ORDER: TermsSectionKey[] = [
  'terms',
  'privacy',
  'personalInfo',
  'healthDisclaimer',
  'ageConfirm',
  'marketing',
  'dataAnalytics',
];

export const LEGAL_SECTIONS: Record<TermsSectionKey, LegalSectionContent> = {
  terms: {
    id: 'terms',
    title: 'Terms of Service',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY.

Before registering for the App, all users must carefully read these Terms and Conditions ("Terms") and the Privacy Policy. The Privacy Policy and Callout User Policy form an inseparable part of these Terms. By using the App, you are deemed to have agreed to these Terms in their entirety. If you do not agree with any part of these Terms, do not use the App.

These Terms may be changed at any time without prior notice. Users should review these Terms regularly, and continued use of the App after any changes constitutes acceptance of the revised Terms.

These Terms include a mandatory arbitration clause, meaning you agree to resolve disputes related to this Service through binding private arbitration rather than in court. They also include a class action waiver, meaning you agree to bring disputes only in your individual capacity and not as a class action.

Section 4 of these Terms governs the scope of the Publisher's disclaimers. You acknowledge that the allergen and dietary restriction information provided by the App is for reference only, and that the Publisher does not guarantee the accuracy, appropriateness, or completeness of such information. You must not consume food based solely on information from the App, and are obligated to personally verify product labels before actual consumption. You expressly agree to use the App at your own risk.

Article 1 - Definitions

The following key terms are defined for the purposes of these Terms:

- App: The Clir mobile application and all related screens and features.
- User: Any individual using the free or paid version of the App.
- Contributor: A user who adds or modifies food information in the Database.
- Customer: A user who purchases the Premium Version within the App.
- Database: The collection of food ingredient and allergen information used by the App for analysis and information provision.
- Analysis Result: The allergen presence and dietary restriction information provided by the App to users.
- Allergen: An ingredient that may trigger an allergic reaction in certain users; reactions may vary by individual.
- Services: All analysis, filtering, and recommendation services provided by Clir in relation to food information.
- Publisher: The legal entity responsible for operating and managing the Clir App and its content.
- Premium Version: Paid digital content accessible through in-app purchase.
- Store: The online platforms from which users download the App (Google Play Store and Apple App Store).

Article 2 - Purpose and Independence of Service

2.1 Purpose

The purpose of Clir is to help users with allergies, vegetarians, vegans, and individuals with specific dietary restrictions more easily understand the ingredient information of food products they consume in daily life, and to support them in making better food choices independently. Specifically, Clir pursues the following goals:

- To enable users to quickly verify whether specific allergens and dietary-restricted ingredients are present
- To provide reference information to assist users in making health and dietary decisions
- To raise consumer awareness of food ingredient transparency

2.2 Independence

The Publisher has no contractual or financial relationship with the manufacturers or distributors of food products evaluated in the App, and strives to maintain objectivity in its analysis results.

- The App may display advertisements; advertising content does not influence the analysis results or recommendations for specific products.
- No brand may pay the Publisher to influence the analysis results of its products or to improve its ranking in App recommendations.
- The Publisher may share or provide anonymized or aggregated data with third parties for service improvement, research, and business purposes. Please refer to the Privacy Policy for details on the collection and use of personal information.

Article 3 - How the Service Works

3.1 Database

Clir maintains its own database containing information on numerous food products, built through contributor contributions and publicly available information and manufacturer-provided data. The Publisher does not guarantee the complete reliability of food ingredient information contained in the Database. The information provided by the App relays information from product labels; the Publisher does not directly analyze ingredients. Ingredient errors or recognition errors may occur.

3.2 Analysis Method

The App collects food information using barcode scanning or OCR (Optical Character Recognition) technology, compares it against the Database, and provides information on allergen presence and dietary restrictions. The following cases may not be included in the App's analysis scope:

- Cross-contamination at manufacturing facilities
- Allergens listed only as precautionary statements on labels (e.g., "May contain")
- Ingredients not accurately listed on the label by the manufacturer

3.3 Nature of Analysis Results

All analysis results provided by the App are reference-only opinions based on the Database, and do not reflect individual users' medical conditions, allergy sensitivity, or special health circumstances. Reactions may vary by individual even with the same ingredient, and the App's analysis results do not guarantee safe consumption. Expressions such as "Safe to consume," "Use caution," and "Do not consume" are reference opinions based on Database information and are not medical judgments. The Publisher makes no warranties regarding the safety or health benefits of any product itself.

3.4 Alternative Product Recommendations

The App may recommend alternative products that align with the user's allergen profile or dietary restrictions. Recommendations are made in a completely neutral and objective manner; no brand pays to influence recommendation results. However, the Publisher does not guarantee that recommended products meet all of the user's dietary requirements, and users must personally verify the ingredients of recommended products as well.

3.5 Premium Version

The App offers a Premium Version as an in-app purchase, which includes the following features:

- Multi-Profile: Create and manage multiple dietary restriction profiles. Each profile can be configured for individual family members or various dietary requirements.
- Unlimited Scans: Scan and review analysis results for unlimited products without the scan limit of the free version.

The terms and conditions for purchasing the Premium Version are detailed in Article 8.

Article 5 - Accounts

5.1 Account Creation

Users may access their accounts through social media login integration upon registration. By creating an account, users agree to the following:

- Creating accounts through bots or automated means is not permitted.
- Without separate authorization, each user may register only one account.
- Without separate authorization, accounts may not be shared with others.

Users bear full responsibility for securely managing their passwords and must not share or disclose their passwords to others. If you believe your account information has been compromised, you must immediately notify the Publisher.

5.2 Account Suspension or Deletion

The Publisher retains exclusive and discretionary authority to suspend or delete accounts of users who violate these Terms at any time without prior notice. Accounts that have been inactive for more than one year may also be subject to deletion. Such suspension or deletion does not preclude the Publisher's right to take legal action against the relevant user.

5.3 Account Termination by User

Users may freely terminate their accounts at any time. To terminate your account, please request via email to the Publisher or follow the in-app deletion procedure.

Article 6 - User Rights and Obligations

6.1 Use Restrictions

Users must comply with applicable laws and these Terms, and in particular must not:

- Post illegal content related to defamation, threats, harassment, incitement of hatred, discrimination, obscenity, or violence
- Probe App vulnerabilities, violate security measures, or insert malicious software
- Use automated programs that interfere with the App's technical infrastructure or collect data without authorization
- Unauthorized use of other users' accounts or collection of personal information
- Use the analysis results and recommendation information provided by the App for commercial purposes

6.2 Adding Food Information

Users may contribute to the Database by adding or modifying food information through the App. Contributors transfer intellectual property rights in their contributions to the Publisher, and the Publisher may distribute or utilize such content for commercial and other purposes. Contributors must:

- Provide only truthful information when contributing
- Add only photographs and information personally obtained; copying information from third-party websites is not permitted
- Information added must be directly verified from actual product packaging

6.3 Modifying Food Information

Users who discover errors may modify the relevant product information or report the error to the Publisher. Contributors who intentionally delete accurate information or enter false information may have their accounts suspended or deleted, and may be subject to legal action.

6.4 Liability of Users and Contributors

Contributors bear full responsibility for the content they post. Users agree to indemnify, defend, and hold harmless the Publisher against all losses, liabilities, damages, costs, and expenses (including reasonable attorney's fees) arising from violations of these Terms.

Article 7 - Intellectual Property

7.1 Publisher's Rights

All intellectual property rights in the components comprising the App, including the App's content, the Clir brand, logo, software, analysis methodology, recommendation algorithms, graphic elements, and database structure, belong to the Publisher and/or third-party rights holders. The Publisher grants users a non-exclusive, revocable license to use the website and App. This license is strictly personal and may not be transferred or assigned to any third party under any circumstances. This license does not grant rights to access, use, or disclose source code.

7.2 Third-Party Intellectual Property

Third-party brands, logos, images, photographs, and text displayed within the App are the exclusive property of their respective authors and are protected by copyright law, trademark law, or other applicable laws. Users must not infringe upon such third-party rights or use such elements without authorization.

Article 8 - Purchase of Premium Version

8.1 Sales Service

The Premium Version is available for purchase as a monthly subscription through the Store and website.

8.2 Pricing

Prices displayed in the App and on the website include applicable VAT on the day of purchase. The Publisher reserves the right to adjust prices to reflect changes in VAT rates and may change prices at any time. However, only the price displayed in the App and on the website on the day of purchase applies to the relevant customer.

8.3 Payment Methods

For purchases through the Store, payment is processed through the payment method registered by the user with the Store, and the Store's terms and conditions take precedence over these Terms. For purchases through the website, only credit card payment is currently available.

8.4 Delivery and Availability

After payment is completed, the customer will receive an order confirmation email, and the Premium Version will be immediately available. If access is unavailable after purchase, please contact us within 3 months of the purchase date.

8.5 Subscription Cancellation

The Premium Version subscription is valid for 30 days from the date of purchase and will automatically renew for the same period if not cancelled by the day before the renewal date. Users may cancel their subscription at any time during the subscription period, but no refund will be provided in such cases. Even after cancellation, Premium features remain accessible until the subscription expiration date. Subscription cancellation can be made through the Store used at the time of subscription or by requesting via email at clir.pbl2026@gmail.com.

Article 9 - General Provisions

9.1 Changes to Terms

The Publisher reserves the right to modify these Terms at any time without prior notice. Modified Terms take effect 14 days after being posted online. Continued use of the Service after that date constitutes acceptance of the modified Terms. If you do not agree to the changes, please discontinue use of the Service.

9.2 Severability

If any provision of these Terms is declared invalid by law, regulation, or a final court judgment, the remaining provisions shall remain in full force and effect.

9.3 No Waiver

If the Publisher refrains from exercising any right in a particular situation, this shall not be interpreted as a waiver of that right.

Article 10 - Dispute Resolution and Governing Law

In the event of a dispute related to Clir, users agree to first provide the Publisher with an opportunity to resolve the issue. To do so, users must send a written notice ("Dispute Notice") to clir.pbl2026@gmail.com or the Publisher's address, including the parties' information, the facts giving rise to the dispute, and the proposed resolution. If the dispute is not resolved within 60 days of the Publisher's receipt of the Dispute Notice, the following dispute resolution procedures shall apply.

10.1 Binding Arbitration

If a dispute is not resolved through informal negotiation, it shall be resolved through binding arbitration. You waive your right to bring a lawsuit before a judge or jury, including the right to participate in a class action. All disputes shall be resolved before a neutral arbitrator, and the arbitrator's decision is final, subject only to limited appellate rights under the Federal Arbitration Act.

10.2 Class Action Waiver

All disputes must be brought in an individual capacity. Both users and the Publisher may not bring or propose disputes in the form of class actions or representative actions. If applicable law does not permit a class action waiver, it shall apply to the extent permitted by such law.

10.3 Arbitration Procedure

Arbitration shall be conducted in accordance with the Commercial Arbitration Rules of the American Arbitration Association (AAA). Users agree to initiate arbitration only at the Publisher's place of business. If the dispute amount is USD $10,000 or less, the hearing shall be conducted by telephone. All claims or disputes must be filed within one year from the date they first arose; claims filed after this period are permanently barred.

Right to Opt Out of Arbitration: Users who do not agree to this arbitration clause must send a written notice to clir.pbl2026@gmail.com within 30 days of first receiving these Terms, stating their name, address, and clear intention not to arbitrate. Opting out of the arbitration clause will not result in any disadvantage to the user's service relationship.

10.4 Governing Law and Jurisdiction

These Terms shall be interpreted in accordance with the laws of the country in which the Publisher is located. For matters not subject to arbitration or related to enforcement of an arbitration award, the courts of the Publisher's location shall have exclusive jurisdiction.

If you do not agree to these Terms, do not use this Service. By installing or using the App, you are deemed to have irrevocably agreed to these Terms in their entirety.

Contact: clir.pbl2026@gmail.com`,
  },
  privacy: {
    id: 'privacy',
    title: 'Privacy Policy',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `This Privacy Policy explains how Clir ("we," "us") collects, stores, uses, and shares users' personal information in the course of providing Services. This Policy applies when:

- You download or use the Clir mobile application
- You visit our website
- You interact with us through customer support, surveys, or other means

If you have questions, contact us at clir.pbl2026@gmail.com. If you do not agree to this Policy, please do not use the Service.

Article 1 - Types of Information Collected

Information directly provided by users

We collect information that users directly provide in the course of registering, using the Service, or submitting inquiries:

- Name
- Email address
- Password
- Allergen and dietary restriction profiles (set by the user)

We do not collect sensitive information. However, allergen and dietary restriction information entered by users may constitute health-related information, which is used only for the purpose of providing Services and is not sold to third parties.

Payment Information

We may collect payment information required for paid Services. Payment information is processed by external payment processors such as Apple Pay, Google Pay, and Stripe; we do not directly store payment information.

Social Login Information

When logging in through a social media account, we may receive certain profile information from that platform, including your name, email address, and profile picture.

Automatically collected information during App use

- Location Information: We may access your device's location information to provide location-based services. You may change permissions in your device settings.
- Camera Access: Camera access permission is required to provide barcode scanning and OCR features.
- Device Information: Technical information such as device ID, model, manufacturer, OS version, IP address, and browser type is collected.
- Log and Usage Data: Service access date and time, features used, search terms, and error reports are collected.
- Push Notifications: We may request push notification permissions to send account or service-related notifications. You may decline in your device settings.

All personal information provided by users must be accurate and complete, and users must notify us of any changes.

Article 2 - How We Process Information

Collected personal information is processed for the following purposes:

- Account creation and management: Creating, authenticating, and maintaining user accounts
- Service provision: Providing core services including allergen analysis, dietary restriction filtering, and alternative product recommendations
- Customer support: Handling user inquiries and complaints
- Payment and order management: Processing and managing payments for paid services
- Service security: Detecting and preventing fraudulent use
- Service improvement: Enhancing service quality through usage pattern analysis
- Aggregated and anonymized research: Generating and analyzing statistical data processed in a form that cannot identify individuals

Article 3 - Legal Basis for Processing Information

For EU/UK residents

We process personal information under the following legal bases in accordance with GDPR and UK GDPR:

- Consent: Where you have consented to the processing of personal information for a specific purpose. Consent may be withdrawn at any time.
- Performance of a contract: Where necessary for the performance of a service agreement
- Legitimate interests: Where necessary for our legitimate business interests, such as fraud prevention and service improvement
- Legal obligation: Where necessary to comply with applicable laws
- Vital interests: Where necessary to protect the life or safety of users or third parties

For Canadian residents

We process personal information based on express or implied consent, and may process without consent where permitted by law.

Article 4 - Sharing Personal Information with Third Parties

We may share personal information with third parties only in the following circumstances:

Service Providers

We share information with the following external service providers to the extent necessary for Service operation, and have entered into data protection agreements with them:

- Cloud services: Google Cloud Platform
- User communications: MailChimp, Brevo, etc.
- Payment processing: Apple Pay, Google Pay, Stripe
- Account authentication: Firebase Authentication, Facebook Login, etc.
- App analytics: Google Analytics for Firebase
- Performance monitoring: Firebase Performance Monitoring, Crashlytics
- App distribution: App Store Connect, Google Play Store

Business Transfers

Personal information may be transferred in connection with mergers, acquisitions, or asset sales.

Affiliates

We may share information with our affiliates, and in such cases, we require those affiliates to comply with this Policy. We have not sold or shared user personal information with third parties for commercial purposes in the past 12 months.

Article 5 - Cookies and Tracking Technologies

We may use cookies and similar tracking technologies to maintain service security, fix errors, and save user settings. Third-party service providers may also use tracking technologies for analytical purposes. Most web browsers accept cookies by default, and you can refuse cookies through your browser settings. However, refusing cookies may limit certain service features.

We use Google Analytics to analyze service usage. To opt out of Google Analytics tracking, please visit the Google Analytics opt-out page.

Article 6 - AI-Based Features

We utilize AI and machine learning technologies for features such as barcode recognition, OCR (image analysis), and ingredient text analysis. These features may be implemented through external AI service providers such as OpenAI and Google Cloud AI, and information used in such processing is protected in accordance with this Policy and our agreements with those service providers.

Article 7 - Social Login Processing

When logging in through a social media account (Facebook, Google, etc.), we may receive information such as your name, email address, and profile picture from that platform. Information received is used only for the purposes specified in this Policy. We are not responsible for the personal information practices of third-party social media platforms; please review those platforms' privacy policies directly.

Article 8 - International Transfer of Information

Our servers may be located in the United States, the Netherlands, and other countries. Your personal information may be transferred to and stored or processed in regions outside your country of residence. For EU/UK/Swiss residents, data protection laws in the countries to which information is transferred may differ from those in your country of residence. We protect personal information through appropriate safeguards such as the European Commission's Standard Contractual Clauses.

Article 9 - Information Retention Period

We retain personal information for as long as your account remains active. When the purpose of retention has ended, we delete or anonymize the information unless we are legally required to retain it. Information stored in backup archives that cannot be immediately deleted is managed by being securely isolated.

Article 10 - How We Protect Information

We implement appropriate technical and administrative security measures to protect personal information. However, since electronic transmission over the internet and information storage technologies cannot guarantee 100% security, we cannot completely exclude the possibility of security breaches by hackers, cybercriminals, or other unauthorized third parties. Please access the Service only from a secure environment.

Article 11 - User Rights

Depending on your country of residence, you may have the following rights:

- Right to request access to whether and how your personal information is being processed
- Right to request correction of personal information
- Right to request deletion of personal information
- Right to request restriction of processing of personal information
- Right to data portability
- Right to object to automated decision-making
- Right to withdraw consent to the processing of personal information

To exercise your rights, please contact us at clir.pbl2026@gmail.com. We will review and process your request in accordance with applicable laws.

Account information changes and withdrawal

To change account information or withdraw from the Service, please submit a request through the in-app settings or via email. Upon withdrawal, your account and related information will be deleted from the active database, but some information may be retained for fraud prevention, legal obligations, and similar purposes.

Withdrawal of consent

To withdraw your consent to the processing of personal information, please contact us at clir.pbl2026@gmail.com. Withdrawal of consent does not affect the lawfulness of processing carried out prior to the withdrawal.

Article 12 - Do-Not-Track

Some web browsers and mobile operating systems provide a Do-Not-Track (DNT) feature that sends a signal indicating you do not wish to be tracked online. As there is currently no unified technical standard for DNT signals, we do not currently respond to DNT signals. If a standard is adopted in the future, we will provide notice through this Policy.

Article 13 - Specific Rights for U.S. Residents

Residents of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, and Virginia may have the following additional rights:

- Right to verify whether and how personal information is being processed
- Right to access personal information
- Right to correct personal information
- Right to delete personal information
- Right to request a copy of previously shared personal information
- Right not to be discriminated against for exercising rights
- Right to opt out of processing used for targeted advertising, sale of personal information, or profiling that produces significant legal effects

How to exercise rights

To exercise your rights, please contact us at clir.pbl2026@gmail.com. Identity verification may be required to process your request. For requests submitted by an authorized agent, a procedure to verify proper authorization will be conducted.

Appeals process

If your request is denied, you may appeal to clir.pbl2026@gmail.com. If your appeal is rejected, you may file a complaint with the attorney general of your state of residence.

California Shine the Light Law

California residents may request, once per year at no charge, a list of the categories of personal information shared with third parties for direct marketing purposes and the names of those third parties. Please submit requests to clir.pbl2026@gmail.com.

Article 14 - Updates to This Privacy Policy

We may update this Policy periodically to comply with applicable laws and to reflect service changes. Updated policies can be identified by the "Last Updated" date at the top. For significant changes, we may provide separate notice through in-app announcements or email. Please review this Policy regularly.

Article 15 - How to Contact Us

clir.pbl2026@gmail.com

Article 16 - How to Access, Correct, or Delete Information

Users have the right to request access, correction, or deletion of personal information we have collected. Requests may be submitted via clir.pbl2026@gmail.com or processed directly through the in-app account settings.`,
  },
  personalInfo: {
    id: 'personalInfo',
    title: 'Personal Information Collection & Use',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Information directly provided by users

We collect information that users directly provide in the course of registering, using the Service, or submitting inquiries:

- Name
- Email address
- Password
- Allergen and dietary restriction profiles (set by the user)

We do not collect sensitive information. However, allergen and dietary restriction information entered by users may constitute health-related information, which is used only for the purpose of providing Services and is not sold to third parties.

Payment Information

We may collect payment information required for paid Services. Payment information is processed by external payment processors such as Apple Pay, Google Pay, and Stripe; we do not directly store payment information.

Social Login Information

When logging in through a social media account, we may receive certain profile information from that platform, including your name, email address, and profile picture.

Automatically collected information during App use

- Location Information: We may access your device's location information to provide location-based services. You may change permissions in your device settings.
- Camera Access: Camera access permission is required to provide barcode scanning and OCR features.
- Device Information: Technical information such as device ID, model, manufacturer, OS version, IP address, and browser type is collected.
- Log and Usage Data: Service access date and time, features used, search terms, and error reports are collected.
- Push Notifications: We may request push notification permissions to send account or service-related notifications. You may decline in your device settings.

All personal information provided by users must be accurate and complete, and users must notify us of any changes.

How we use your information

Collected personal information is processed for the following purposes:

- Account creation and management: Creating, authenticating, and maintaining user accounts
- Service provision: Providing core services including allergen analysis, dietary restriction filtering, and alternative product recommendations
- Customer support: Handling user inquiries and complaints
- Payment and order management: Processing and managing payments for paid services
- Service security: Detecting and preventing fraudulent use
- Service improvement: Enhancing service quality through usage pattern analysis
- Aggregated and anonymized research: Generating and analyzing statistical data processed in a form that cannot identify individuals`,
  },
  healthDisclaimer: {
    id: 'healthDisclaimer',
    title: 'Health Disclaimer',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `This is a key provision of these Terms. Please read it carefully before using the Service.

The app's analysis is for reference only. Always check product labels before consumption.

4.1 Disclaimer regarding accuracy of information

The App provides general and reference-only information to users. The Publisher does not guarantee the appropriateness, accuracy, or completeness of data displayed in the App. Such information is provided "AS IS" and "AS AVAILABLE" without express or implied warranties. The Publisher expressly disclaims all implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.

In particular, the Publisher accepts no legal liability for:

- Errors, omissions, or incompleteness of food ingredient information contained in the Database
- Cases where manufacturer ingredient changes, formula modifications, or label updates are not reflected in the Database
- Technical errors occurring during OCR recognition or barcode scanning
- Risk of allergen contamination due to cross-contamination or shared manufacturing facilities
- Confusion arising from ingredient differences among multiple products sharing the same product name
- Failure to account for a user's specific allergy sensitivity or medical condition

4.2 User verification obligation

After reviewing the App's analysis results, users are obligated to personally verify the ingredient label on the product packaging with their own eyes before actual consumption. The App's information must be used only as a supplementary reference, not as a final verification tool. The Publisher bears no responsibility whatsoever for health damage resulting from food consumption based solely on the App's information.

4.3 Disclaimer of medical liability

This Service is not a medical device and does not replace medical diagnosis, prescription, or medical advice. Users must not use this App for medical purposes. In particular:

- Users with serious food allergies (including the possibility of anaphylactic reactions) must not make food consumption decisions based solely on the App's analysis results.
- Users must not neglect or delay seeking medical advice or professional treatment because of information read in the App.
- If you have health concerns, you must consult a physician or nutrition specialist.

4.4 Limitation of damages

To the maximum extent permitted by applicable law, the Publisher shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages (including physical injury, property damage, medical expenses, lost profits, and data loss) arising from or related to the use or inability to use the App, regardless of the legal basis (warranty, contract, tort, statute, or otherwise), even if the Publisher has been previously advised of the possibility of such damages.

If the Publisher's liability is established, the total amount shall not exceed the amount the user actually paid for an annual Premium Version subscription; for free version users, this shall not exceed USD $100.

Some jurisdictions do not allow limitations on liability, in which case the Publisher's liability shall be recognized only to the minimum extent permitted by applicable law.

4.5 Disclaimer regarding App accessibility

The Publisher shall not be liable for technical unavailability of the Service due to force majeure, maintenance, updates, network failures, power outages, or similar events. If all or part of the App becomes unavailable due to hardware incompatibility or other reasons, no compensation, refund, or legal liability shall arise.

4.6 Disclaimer regarding external resources

Through the App, users may access external resources operated by third parties (such as scientific research materials). The Publisher has no control over the content or availability of such external resources, and is not responsible for any damages resulting from their content or users' use thereof.`,
  },
  ageConfirm: {
    id: 'ageConfirm',
    title: 'Age Verification',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `I am 13 years of age or older.

Age requirement

This Service is not intended for children under the age of 13. By using the App, you confirm that you are 13 years of age or older.

Account creation conditions (Article 5.1)

By creating an account, users agree to the following:

- Creating accounts through bots or automated means is not permitted.
- Without separate authorization, each user may register only one account.
- Without separate authorization, accounts may not be shared with others.

Users bear full responsibility for securely managing their passwords and must not share or disclose their passwords to others.

Protection of minors

We do not intentionally collect personal information from children under the age of 13. If we become aware that information from a child under 13 has been collected, we will take steps to promptly delete that information. If you believe a child under 13 is using our Service, please notify us at clir.pbl2026@gmail.com.`,
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing Communications',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `This item is optional. Declining will not restrict your use of the Service.

Marketing information

If you consent, we may send the following types of marketing information via email or in-app notifications:

- New features and service update announcements
- Premium Version benefits and promotional information
- Food allergy and health-related newsletters
- App usage tips and guides

How to opt out

Even after consenting to marketing communications, you may opt out at any time:

- By clicking the unsubscribe link at the bottom of a marketing email
- By disabling marketing notifications in the App's notification settings
- By sending an opt-out request to clir.pbl2026@gmail.com

Opt-out processing may take up to 10 business days. Even after opting out of marketing communications, you will continue to receive transactional notifications directly related to your use of the Service (e.g., account notifications, payment receipts).

Marketing partners

We use external email services such as MailChimp and Brevo to send marketing emails. We have entered into data protection agreements with these services, and they do not use user information for any purpose other than marketing.`,
  },
  dataAnalytics: {
    id: 'dataAnalytics',
    title: 'Data Analytics Consent',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `This item is optional. Declining will not restrict your use of the Service.

Collection and analysis purposes

If you consent, we analyze anonymized and aggregated usage data to improve our Services:

- App usage pattern analysis: frequently used features, scan frequency, search patterns, etc.
- Error and performance analysis: app crash logs, response times, error frequency
- User experience improvement: user behavior data for UI/UX enhancements
- Service development: understanding demand for new feature development

Analytics tools we use

- Google Analytics for Firebase: App usage analysis
- Firebase Performance Monitoring: App performance monitoring
- Crashlytics: Error and crash reporting

How data is processed

Data used for analytics is processed in a form that cannot identify individuals. Collected data is used only for service improvement purposes and is not sold to third parties. Analytics data is retained for a maximum of 26 months. The Publisher may share or provide anonymized or aggregated data with third parties for service improvement, research, and business purposes; no directly identifiable personal information is included.

Withdrawing consent

To withdraw your analytics consent, please contact us at clir.pbl2026@gmail.com or disable analytics data collection in the App's settings. To opt out of Google Analytics tracking, please visit the Google Analytics opt-out page.`,
  },
};
