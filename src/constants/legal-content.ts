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

// ─── 한국어 약관 ──────────────────────────────────────────────────────────────

export const LEGAL_SECTIONS_KO: Record<TermsSectionKey, LegalSectionContent> = {
  terms: {
    id: 'terms',
    title: '서비스 이용약관',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본 약관을 주의 깊게 읽어 주십시오.

앱에 가입하기 전에 모든 이용자는 본 이용약관("약관")과 개인정보 처리방침을 주의 깊게 읽어야 합니다. 개인정보 처리방침 및 콜아웃 이용자 정책은 본 약관의 불가분한 일부를 구성합니다. 앱을 이용함으로써 이용자는 본 약관 전체에 동의한 것으로 간주됩니다. 본 약관의 어떠한 부분에도 동의하지 않는 경우, 앱을 이용하지 마십시오.

본 약관은 사전 통지 없이 언제든지 변경될 수 있습니다. 이용자는 정기적으로 본 약관을 검토해야 하며, 변경 후에도 앱을 계속 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.

본 약관에는 의무적 중재 조항이 포함되어 있으며, 이는 본 서비스와 관련된 분쟁을 법원이 아닌 구속력 있는 사적 중재를 통해 해결하기로 동의함을 의미합니다. 또한 집단 소송 포기 조항이 포함되어 있으며, 이는 이용자가 집단 소송이 아닌 개인 자격으로만 분쟁을 제기하기로 동의함을 의미합니다.

본 약관 제4조는 게시자의 면책 범위를 규정합니다. 이용자는 앱이 제공하는 알레르겐 및 식이 제한 정보가 참고용에 불과하며, 게시자가 해당 정보의 정확성, 적절성 또는 완전성을 보장하지 않는다는 사실을 인정합니다. 이용자는 앱의 정보만을 근거로 식품을 섭취해서는 안 되며, 실제 섭취 전에 제품 라벨을 직접 확인할 의무가 있습니다. 이용자는 자신의 책임 하에 앱을 이용하는 데 명시적으로 동의합니다.

제1조 - 정의

본 약관에서 사용되는 주요 용어는 다음과 같이 정의됩니다.

- 앱: Clir 모바일 애플리케이션 및 관련된 모든 화면과 기능.
- 이용자: 앱의 무료 또는 유료 버전을 이용하는 모든 개인.
- 기여자: 데이터베이스에 식품 정보를 추가하거나 수정하는 이용자.
- 고객: 앱 내에서 프리미엄 버전을 구매하는 이용자.
- 데이터베이스: 앱이 분석 및 정보 제공에 사용하는 식품 성분 및 알레르겐 정보 모음.
- 분석 결과: 앱이 이용자에게 제공하는 알레르겐 존재 여부 및 식이 제한 정보.
- 알레르겐: 특정 이용자에게 알레르기 반응을 유발할 수 있는 성분; 반응은 개인에 따라 다를 수 있음.
- 서비스: Clir가 식품 정보와 관련하여 제공하는 모든 분석, 필터링 및 추천 서비스.
- 게시자: Clir 앱과 그 콘텐츠의 운영 및 관리를 책임지는 법인.
- 프리미엄 버전: 앱 내 구매를 통해 이용 가능한 유료 디지털 콘텐츠.
- 스토어: 이용자가 앱을 다운로드하는 온라인 플랫폼(Google Play 스토어 및 Apple App Store).

제2조 - 서비스의 목적 및 독립성

2.1 목적

Clir의 목적은 알레르기가 있는 이용자, 채식주의자, 비건, 특정 식이 제한이 있는 개인이 일상생활에서 소비하는 식품의 성분 정보를 보다 쉽게 이해하고, 독립적으로 더 나은 식품 선택을 할 수 있도록 지원하는 것입니다. 구체적으로 Clir는 다음과 같은 목표를 추구합니다.

- 이용자가 특정 알레르겐 및 식이 제한 성분의 존재 여부를 신속하게 확인할 수 있도록 지원
- 이용자가 건강 및 식이 결정을 내리는 데 도움이 되는 참고 정보 제공
- 식품 성분 투명성에 대한 소비자 인식 제고

2.2 독립성

게시자는 앱에서 평가되는 식품 제조업체 또는 유통업체와 계약 또는 재정적 관계가 없으며, 분석 결과의 객관성을 유지하기 위해 노력합니다.

- 앱에는 광고가 표시될 수 있으나, 광고 콘텐츠는 특정 제품의 분석 결과나 추천에 영향을 미치지 않습니다.
- 어떠한 브랜드도 게시자에게 비용을 지불하여 자사 제품의 분석 결과나 앱 추천 순위에 영향을 줄 수 없습니다.
- 게시자는 서비스 개선, 연구 및 사업 목적으로 익명화 또는 집계된 데이터를 제3자와 공유하거나 제공할 수 있습니다. 개인정보 수집 및 이용에 관한 자세한 내용은 개인정보 처리방침을 참조하십시오.

제3조 - 서비스 작동 방식

3.1 데이터베이스

Clir는 기여자의 기여 및 공개적으로 이용 가능한 정보와 제조업체 제공 데이터를 통해 구축된, 수많은 식품에 관한 정보를 포함하는 자체 데이터베이스를 유지합니다. 게시자는 데이터베이스에 포함된 식품 성분 정보의 완전한 신뢰성을 보장하지 않습니다. 앱이 제공하는 정보는 제품 라벨의 정보를 전달하는 것이며, 게시자는 성분을 직접 분석하지 않습니다. 성분 오류 또는 인식 오류가 발생할 수 있습니다.

3.2 분석 방법

앱은 바코드 스캔 또는 OCR(광학 문자 인식) 기술을 사용하여 식품 정보를 수집하고, 이를 데이터베이스와 비교하여 알레르겐 존재 및 식이 제한에 관한 정보를 제공합니다. 다음의 경우는 앱의 분석 범위에 포함되지 않을 수 있습니다.

- 제조 시설에서의 교차 오염
- 라벨에 주의 문구로만 표시된 알레르겐(예: "포함될 수 있음")
- 제조업체가 라벨에 정확하게 기재하지 않은 성분

3.3 분석 결과의 성질

앱이 제공하는 모든 분석 결과는 데이터베이스를 기반으로 한 참고용 의견이며, 개별 이용자의 의학적 상태, 알레르기 민감도 또는 특수한 건강 상황을 반영하지 않습니다. 동일한 성분이라도 개인에 따라 반응이 다를 수 있으며, 앱의 분석 결과가 안전한 섭취를 보장하지는 않습니다. "섭취 가능", "주의 필요", "섭취 불가"와 같은 표현은 데이터베이스 정보를 기반으로 한 참고 의견이며 의학적 판단이 아닙니다. 게시자는 특정 제품 자체의 안전성 또는 건강상 이점에 관해 어떠한 보증도 하지 않습니다.

3.4 대체 제품 추천

앱은 이용자의 알레르겐 프로필 또는 식이 제한에 부합하는 대체 제품을 추천할 수 있습니다. 추천은 완전히 중립적이고 객관적인 방식으로 이루어지며, 어떠한 브랜드도 추천 결과에 영향을 미치기 위해 비용을 지불하지 않습니다. 다만, 게시자는 추천된 제품이 이용자의 모든 식이 요건을 충족한다고 보장하지 않으며, 이용자는 추천된 제품의 성분도 직접 확인해야 합니다.

3.5 프리미엄 버전

앱은 앱 내 구매로 프리미엄 버전을 제공하며, 다음 기능이 포함됩니다.

- 멀티 프로필: 다수의 식이 제한 프로필을 생성하고 관리합니다. 각 프로필은 개별 가족 구성원 또는 다양한 식이 요건에 맞게 구성할 수 있습니다.
- 무제한 스캔: 무료 버전의 스캔 제한 없이 무제한으로 제품을 스캔하고 분석 결과를 확인합니다.

프리미엄 버전 구매에 관한 이용 조건은 제8조에 자세히 규정되어 있습니다.

제5조 - 계정

5.1 계정 생성

이용자는 가입 시 소셜 미디어 로그인 연동을 통해 계정에 접근할 수 있습니다. 계정을 생성함으로써 이용자는 다음에 동의합니다.

- 봇 또는 자동화된 수단을 통한 계정 생성은 허용되지 않습니다.
- 별도의 승인 없이 각 이용자는 하나의 계정만 등록할 수 있습니다.
- 별도의 승인 없이 계정을 타인과 공유할 수 없습니다.

이용자는 비밀번호를 안전하게 관리할 전적인 책임이 있으며, 타인에게 비밀번호를 공유하거나 공개해서는 안 됩니다. 계정 정보가 침해되었다고 판단되는 경우, 즉시 게시자에게 통지해야 합니다.

5.2 계정 정지 또는 삭제

게시자는 사전 통지 없이 언제든지 본 약관을 위반한 이용자의 계정을 정지하거나 삭제할 독점적이고 재량적인 권한을 보유합니다. 1년 이상 비활성 상태인 계정도 삭제 대상이 될 수 있습니다. 이러한 정지 또는 삭제는 해당 이용자에 대한 게시자의 법적 조치 권한을 배제하지 않습니다.

5.3 이용자에 의한 계정 해지

이용자는 언제든지 자유롭게 계정을 해지할 수 있습니다. 계정을 해지하려면 게시자에게 이메일로 요청하거나 앱 내 삭제 절차를 따르십시오.

제6조 - 이용자 권리 및 의무

6.1 이용 제한

이용자는 관계 법령과 본 약관을 준수해야 하며, 특히 다음 행위를 해서는 안 됩니다.

- 명예 훼손, 위협, 괴롭힘, 혐오 조장, 차별, 음란물 또는 폭력 관련 불법 콘텐츠 게시
- 앱 취약점 탐색, 보안 조치 위반 또는 악성 소프트웨어 삽입
- 앱의 기술 인프라를 방해하거나 무단으로 데이터를 수집하는 자동화 프로그램 사용
- 다른 이용자의 계정 무단 사용 또는 개인정보 수집
- 앱이 제공하는 분석 결과 및 추천 정보의 상업적 이용

6.2 식품 정보 추가

이용자는 앱을 통해 식품 정보를 추가하거나 수정하여 데이터베이스에 기여할 수 있습니다. 기여자는 자신의 기여물에 대한 지식재산권을 게시자에게 양도하며, 게시자는 해당 콘텐츠를 상업적 목적 등을 위해 배포하거나 활용할 수 있습니다. 기여자는 다음을 준수해야 합니다.

- 기여 시 오직 사실에 근거한 정보만 제공
- 직접 취득한 사진과 정보만 추가; 제3자 웹사이트의 정보 복사 불가
- 추가되는 정보는 실제 제품 포장에서 직접 확인한 것이어야 함

6.3 식품 정보 수정

오류를 발견한 이용자는 해당 제품 정보를 수정하거나 게시자에게 오류를 신고할 수 있습니다. 정확한 정보를 의도적으로 삭제하거나 허위 정보를 입력하는 기여자는 계정 정지 또는 삭제될 수 있으며, 법적 조치를 받을 수 있습니다.

6.4 이용자 및 기여자의 책임

기여자는 자신이 게시한 콘텐츠에 대한 전적인 책임을 집니다. 이용자는 본 약관 위반으로 인해 발생하는 모든 손실, 부채, 손해, 비용 및 경비(합리적인 변호사 비용 포함)에 대해 게시자를 면책, 방어 및 무해하게 유지하는 데 동의합니다.

제7조 - 지식재산권

7.1 게시자의 권리

앱의 콘텐츠, Clir 브랜드, 로고, 소프트웨어, 분석 방법론, 추천 알고리즘, 그래픽 요소 및 데이터베이스 구조를 포함하여 앱을 구성하는 모든 구성 요소에 대한 지식재산권은 게시자 및/또는 제3자 권리자에게 귀속됩니다. 게시자는 이용자에게 웹사이트 및 앱을 이용할 수 있는 비독점적, 철회 가능한 라이선스를 부여합니다. 이 라이선스는 엄격히 개인적인 것으로 어떠한 경우에도 제3자에게 양도하거나 이전할 수 없습니다. 이 라이선스는 소스 코드에 대한 접근, 이용 또는 공개 권한을 부여하지 않습니다.

7.2 제3자 지식재산권

앱 내에 표시되는 제3자 브랜드, 로고, 이미지, 사진 및 텍스트는 각 저작자의 독점적 소유물로서 저작권법, 상표법 또는 기타 관계 법령에 의해 보호됩니다. 이용자는 그러한 제3자의 권리를 침해하거나 무단으로 해당 요소를 이용해서는 안 됩니다.

제8조 - 프리미엄 버전 구매

8.1 판매 서비스

프리미엄 버전은 스토어 및 웹사이트를 통해 월정액 구독 방식으로 구매할 수 있습니다.

8.2 가격

앱과 웹사이트에 표시되는 가격에는 구매일 기준 부가가치세가 포함되어 있습니다. 게시자는 부가가치세율 변경을 반영하여 가격을 조정할 권리를 보유하며, 언제든지 가격을 변경할 수 있습니다. 다만, 해당 고객에게는 구매일에 앱과 웹사이트에 표시된 가격만 적용됩니다.

8.3 결제 방법

스토어를 통한 구매의 경우, 결제는 이용자가 스토어에 등록한 결제 수단을 통해 처리되며, 스토어의 이용 약관이 본 약관에 우선합니다. 웹사이트를 통한 구매의 경우, 현재 신용카드 결제만 가능합니다.

8.4 배송 및 이용 가능 여부

결제 완료 후 고객은 주문 확인 이메일을 받으며, 프리미엄 버전을 즉시 이용할 수 있습니다. 구매 후 이용이 불가한 경우, 구매일로부터 3개월 이내에 연락해 주십시오.

8.5 구독 취소

프리미엄 버전 구독은 구매일로부터 30일간 유효하며, 갱신일 전날까지 취소하지 않으면 동일한 기간으로 자동 갱신됩니다. 이용자는 구독 기간 중 언제든지 구독을 취소할 수 있으나, 이 경우 환불은 제공되지 않습니다. 취소 후에도 구독 만료일까지 프리미엄 기능을 계속 이용할 수 있습니다. 구독 취소는 구독 시 이용한 스토어를 통하거나 clir.pbl2026@gmail.com으로 이메일 요청을 통해 할 수 있습니다.

제9조 - 일반 조항

9.1 약관 변경

게시자는 사전 통지 없이 언제든지 본 약관을 수정할 권리를 보유합니다. 수정된 약관은 온라인 게시 후 14일이 지나면 효력이 발생합니다. 그 이후에도 서비스를 계속 이용하면 수정된 약관에 동의한 것으로 간주됩니다. 변경 사항에 동의하지 않는 경우, 서비스 이용을 중단하십시오.

9.2 가분성

본 약관의 어떤 조항이 법률, 규정 또는 최종 법원 판결에 의해 무효로 선언되더라도, 나머지 조항은 완전한 효력을 유지합니다.

9.3 권리 불포기

게시자가 특정 상황에서 어떤 권리의 행사를 삼가는 것은 해당 권리의 포기로 해석되지 않습니다.

제10조 - 분쟁 해결 및 준거법

Clir와 관련된 분쟁이 발생한 경우, 이용자는 먼저 게시자에게 문제를 해결할 기회를 제공하기로 동의합니다. 이를 위해 이용자는 당사자 정보, 분쟁의 원인이 된 사실 및 제안된 해결책을 포함한 서면 통지("분쟁 통지")를 clir.pbl2026@gmail.com 또는 게시자의 주소로 발송해야 합니다. 게시자가 분쟁 통지를 수령한 날로부터 60일 이내에 분쟁이 해결되지 않으면, 다음의 분쟁 해결 절차가 적용됩니다.

10.1 구속력 있는 중재

분쟁이 비공식 협상을 통해 해결되지 않는 경우, 구속력 있는 중재를 통해 해결됩니다. 이용자는 집단 소송에 참여할 권리를 포함하여 판사나 배심원 앞에서 소송을 제기할 권리를 포기합니다. 모든 분쟁은 중립적인 중재인 앞에서 해결되며, 중재인의 결정은 연방 중재법에 따른 제한적인 항소권의 적용을 받아 최종적입니다.

10.2 집단 소송 포기

모든 분쟁은 개인 자격으로 제기되어야 합니다. 이용자와 게시자 모두 집단 소송 또는 대표 소송의 형태로 분쟁을 제기하거나 제안할 수 없습니다. 관계 법령이 집단 소송 포기를 허용하지 않는 경우, 해당 법령이 허용하는 범위 내에서 적용됩니다.

10.3 중재 절차

중재는 미국중재협회(AAA)의 상업 중재 규칙에 따라 진행됩니다. 이용자는 게시자의 영업소 소재지에서만 중재를 개시하기로 동의합니다. 분쟁 금액이 미화 10,000달러 이하인 경우 심리는 전화로 진행됩니다. 모든 청구 또는 분쟁은 최초 발생일로부터 1년 이내에 제기되어야 하며, 이 기간 이후에 제기된 청구는 영구적으로 차단됩니다.

중재 탈퇴 권리: 본 중재 조항에 동의하지 않는 이용자는 본 약관을 최초로 수령한 날로부터 30일 이내에 이름, 주소 및 중재를 원하지 않는다는 명확한 의사를 기재한 서면 통지를 clir.pbl2026@gmail.com으로 발송해야 합니다. 중재 조항 탈퇴는 이용자의 서비스 관계에 어떠한 불이익도 초래하지 않습니다.

10.4 준거법 및 관할권

본 약관은 게시자가 소재한 국가의 법률에 따라 해석됩니다. 중재 대상이 아니거나 중재 판정의 집행과 관련된 사항에 대해서는 게시자 소재지의 법원이 전속 관할권을 가집니다.

본 약관에 동의하지 않는 경우, 본 서비스를 이용하지 마십시오. 앱을 설치하거나 이용함으로써 이용자는 본 약관 전체에 취소 불가능하게 동의한 것으로 간주됩니다.

문의: clir.pbl2026@gmail.com`,
  },
  privacy: {
    id: 'privacy',
    title: '개인정보 처리방침',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본 개인정보 처리방침은 Clir("당사")가 서비스를 제공하는 과정에서 이용자의 개인정보를 어떻게 수집, 저장, 이용 및 공유하는지 설명합니다. 본 방침은 다음의 경우에 적용됩니다.

- Clir 모바일 애플리케이션을 다운로드하거나 이용하는 경우
- 당사의 웹사이트를 방문하는 경우
- 고객 지원, 설문조사 또는 기타 수단을 통해 당사와 상호작용하는 경우

문의 사항이 있으면 clir.pbl2026@gmail.com으로 연락하십시오. 본 방침에 동의하지 않는 경우, 서비스를 이용하지 마십시오.

제1조 - 수집하는 정보의 유형

이용자가 직접 제공하는 정보

당사는 이용자가 가입, 서비스 이용 또는 문의 제출 과정에서 직접 제공하는 정보를 수집합니다.

- 이름
- 이메일 주소
- 비밀번호
- 이용자가 설정한 알레르겐 및 식이 제한 프로필

당사는 민감한 정보를 수집하지 않습니다. 다만, 이용자가 입력한 알레르겐 및 식이 제한 정보는 건강 관련 정보에 해당할 수 있으며, 이는 서비스 제공 목적으로만 사용되고 제3자에게 판매되지 않습니다.

결제 정보

당사는 유료 서비스에 필요한 결제 정보를 수집할 수 있습니다. 결제 정보는 Apple Pay, Google Pay, Stripe 등 외부 결제 처리업체에 의해 처리되며, 당사는 결제 정보를 직접 저장하지 않습니다.

소셜 로그인 정보

소셜 미디어 계정을 통해 로그인하는 경우, 해당 플랫폼으로부터 이름, 이메일 주소, 프로필 사진 등 일부 프로필 정보를 수신할 수 있습니다.

앱 이용 중 자동으로 수집되는 정보

- 위치 정보: 위치 기반 서비스를 제공하기 위해 기기의 위치 정보에 접근할 수 있습니다. 기기 설정에서 권한을 변경할 수 있습니다.
- 카메라 접근: 바코드 스캔 및 OCR 기능을 제공하기 위해 카메라 접근 권한이 필요합니다.
- 기기 정보: 기기 ID, 모델, 제조사, OS 버전, IP 주소, 브라우저 유형 등 기술적 정보가 수집됩니다.
- 로그 및 이용 데이터: 서비스 접속 날짜 및 시간, 이용한 기능, 검색어, 오류 보고서가 수집됩니다.
- 푸시 알림: 계정 또는 서비스 관련 알림을 전송하기 위해 푸시 알림 권한을 요청할 수 있습니다. 기기 설정에서 거부할 수 있습니다.

이용자가 제공하는 모든 개인정보는 정확하고 완전해야 하며, 변경 사항이 있는 경우 당사에 통지해야 합니다.

제2조 - 정보 처리 방법

수집된 개인정보는 다음의 목적으로 처리됩니다.

- 계정 생성 및 관리: 이용자 계정의 생성, 인증 및 유지
- 서비스 제공: 알레르겐 분석, 식이 제한 필터링 및 대체 제품 추천 등 핵심 서비스 제공
- 고객 지원: 이용자의 문의 및 불만 처리
- 결제 및 주문 관리: 유료 서비스에 대한 결제 처리 및 관리
- 서비스 보안: 부정 이용 탐지 및 방지
- 서비스 개선: 이용 패턴 분석을 통한 서비스 품질 향상
- 집계 및 익명화 연구: 개인을 식별할 수 없는 형태로 처리된 통계 데이터 생성 및 분석

제3조 - 정보 처리의 법적 근거

EU/영국 거주자의 경우

당사는 GDPR 및 영국 GDPR에 따라 다음의 법적 근거 하에 개인정보를 처리합니다.

- 동의: 이용자가 특정 목적을 위한 개인정보 처리에 동의한 경우. 동의는 언제든지 철회할 수 있습니다.
- 계약 이행: 서비스 계약 이행에 필요한 경우
- 정당한 이익: 사기 방지 및 서비스 개선 등 당사의 정당한 사업 이익을 위해 필요한 경우
- 법적 의무: 관계 법령을 준수하기 위해 필요한 경우
- 중요한 이익: 이용자 또는 제3자의 생명 또는 안전을 보호하기 위해 필요한 경우

캐나다 거주자의 경우

당사는 명시적 또는 묵시적 동의를 기반으로 개인정보를 처리하며, 법률이 허용하는 경우 동의 없이 처리할 수 있습니다.

제4조 - 개인정보의 제3자 공유

당사는 다음의 경우에만 개인정보를 제3자와 공유할 수 있습니다.

서비스 제공업체

당사는 서비스 운영에 필요한 범위 내에서 다음의 외부 서비스 제공업체와 정보를 공유하며, 이들과 데이터 보호 계약을 체결하였습니다.

- 클라우드 서비스: Google Cloud Platform
- 이용자 커뮤니케이션: MailChimp, Brevo 등
- 결제 처리: Apple Pay, Google Pay, Stripe
- 계정 인증: Firebase Authentication, Facebook Login 등
- 앱 분석: Google Analytics for Firebase
- 성능 모니터링: Firebase Performance Monitoring, Crashlytics
- 앱 배포: App Store Connect, Google Play Store

사업 양수도

합병, 인수 또는 자산 매각과 관련하여 개인정보가 이전될 수 있습니다.

계열사

당사는 계열사와 정보를 공유할 수 있으며, 이 경우 해당 계열사가 본 방침을 준수하도록 요구합니다. 당사는 지난 12개월 동안 이용자의 개인정보를 상업적 목적으로 제3자에게 판매하거나 공유한 적이 없습니다.

제5조 - 쿠키 및 추적 기술

당사는 서비스 보안 유지, 오류 수정 및 이용자 설정 저장을 위해 쿠키 및 유사한 추적 기술을 사용할 수 있습니다. 제3자 서비스 제공업체도 분석 목적으로 추적 기술을 사용할 수 있습니다. 대부분의 웹 브라우저는 기본적으로 쿠키를 허용하며, 브라우저 설정을 통해 쿠키를 거부할 수 있습니다. 다만, 쿠키를 거부하면 일부 서비스 기능이 제한될 수 있습니다.

당사는 서비스 이용 분석을 위해 Google Analytics를 사용합니다. Google Analytics 추적을 거부하려면 Google Analytics 옵트아웃 페이지를 방문하십시오.

제6조 - AI 기반 기능

당사는 바코드 인식, OCR(이미지 분석), 성분 텍스트 분석 등의 기능에 AI 및 기계 학습 기술을 활용합니다. 이러한 기능은 OpenAI, Google Cloud AI 등 외부 AI 서비스 제공업체를 통해 구현될 수 있으며, 이러한 처리에 사용되는 정보는 본 방침과 해당 서비스 제공업체와의 계약에 따라 보호됩니다.

제7조 - 소셜 로그인 처리

소셜 미디어 계정(Facebook, Google 등)을 통해 로그인하는 경우, 해당 플랫폼으로부터 이름, 이메일 주소, 프로필 사진 등의 정보를 수신할 수 있습니다. 수신한 정보는 본 방침에 명시된 목적으로만 사용됩니다. 당사는 제3자 소셜 미디어 플랫폼의 개인정보 관행에 대해 책임지지 않으며, 해당 플랫폼의 개인정보 처리방침을 직접 검토하시기 바랍니다.

제8조 - 정보의 국제 이전

당사의 서버는 미국, 네덜란드 및 기타 국가에 위치할 수 있습니다. 이용자의 개인정보는 이용자의 거주 국가 이외의 지역으로 이전, 저장 또는 처리될 수 있습니다. EU/영국/스위스 거주자의 경우, 정보가 이전되는 국가의 데이터 보호법이 이용자의 거주 국가와 다를 수 있습니다. 당사는 유럽 집행위원회의 표준 계약 조항 등 적절한 안전장치를 통해 개인정보를 보호합니다.

제9조 - 정보 보유 기간

당사는 이용자의 계정이 활성 상태를 유지하는 동안 개인정보를 보유합니다. 보유 목적이 종료되면, 법적으로 보유가 요구되지 않는 한 해당 정보를 삭제하거나 익명화합니다. 즉시 삭제할 수 없는 백업 아카이브에 저장된 정보는 안전하게 격리하여 관리합니다.

제10조 - 정보 보호 방법

당사는 개인정보를 보호하기 위해 적절한 기술적·관리적 보안 조치를 시행합니다. 다만, 인터넷을 통한 전자적 전송과 정보 저장 기술은 100% 보안을 보장할 수 없으므로, 해커, 사이버 범죄자 또는 기타 무단 제3자에 의한 보안 침해 가능성을 완전히 배제할 수는 없습니다. 안전한 환경에서만 서비스에 접근하십시오.

제11조 - 이용자 권리

이용자는 거주 국가에 따라 다음의 권리를 가질 수 있습니다.

- 개인정보의 처리 여부 및 방법에 대한 접근 요청 권리
- 개인정보 정정 요청 권리
- 개인정보 삭제 요청 권리
- 개인정보 처리 제한 요청 권리
- 데이터 이동성 권리
- 자동화된 의사결정에 대한 이의 제기 권리
- 개인정보 처리에 대한 동의 철회 권리

권리를 행사하려면 clir.pbl2026@gmail.com으로 연락하십시오. 당사는 관계 법령에 따라 이용자의 요청을 검토하고 처리할 것입니다.

계정 정보 변경 및 탈퇴

계정 정보를 변경하거나 서비스에서 탈퇴하려면 앱 내 설정 또는 이메일을 통해 요청을 제출하십시오. 탈퇴 시 이용자의 계정 및 관련 정보는 활성 데이터베이스에서 삭제되지만, 일부 정보는 사기 방지, 법적 의무 등의 목적으로 보유될 수 있습니다.

동의 철회

개인정보 처리에 대한 동의를 철회하려면 clir.pbl2026@gmail.com으로 연락하십시오. 동의 철회는 철회 전에 이루어진 처리의 적법성에 영향을 미치지 않습니다.

제12조 - 추적 거부(Do-Not-Track)

일부 웹 브라우저 및 모바일 운영 체제는 온라인 추적을 원하지 않는다는 신호를 전송하는 추적 거부(DNT) 기능을 제공합니다. 현재 DNT 신호에 대한 통일된 기술 표준이 없으므로, 당사는 현재 DNT 신호에 응답하지 않습니다. 향후 표준이 채택되면 본 방침을 통해 공지할 것입니다.

제13조 - 미국 거주자의 특정 권리

캘리포니아, 콜로라도, 코네티컷, 델라웨어, 플로리다, 인디애나, 아이오와, 켄터키, 메릴랜드, 미네소타, 몬태나, 네브래스카, 뉴햄프셔, 뉴저지, 오레곤, 로드아일랜드, 테네시, 텍사스, 유타 및 버지니아 거주자는 다음의 추가적인 권리를 가질 수 있습니다.

- 개인정보의 처리 여부 및 방법 확인 권리
- 개인정보 접근 권리
- 개인정보 정정 권리
- 개인정보 삭제 권리
- 이전에 공유된 개인정보 사본 요청 권리
- 권리 행사로 인한 차별을 받지 않을 권리
- 맞춤형 광고, 개인정보 판매 또는 중대한 법적 효과를 초래하는 프로파일링에 사용되는 처리의 거부 권리

권리 행사 방법

권리를 행사하려면 clir.pbl2026@gmail.com으로 연락하십시오. 요청을 처리하기 위해 신원 확인이 필요할 수 있습니다. 권한을 위임한 대리인이 제출한 요청의 경우, 적절한 권한 부여 여부를 확인하는 절차가 진행됩니다.

이의 제기 절차

요청이 거부된 경우, clir.pbl2026@gmail.com으로 이의를 제기할 수 있습니다. 이의 제기가 기각되면 거주지 주의 법무장관에게 불만을 제기할 수 있습니다.

캘리포니아 Shine the Light 법

캘리포니아 거주자는 연 1회 무료로 직접 마케팅 목적으로 제3자와 공유한 개인정보의 범주 목록과 해당 제3자의 명칭을 요청할 수 있습니다. 요청은 clir.pbl2026@gmail.com으로 제출하십시오.

제14조 - 개인정보 처리방침 업데이트

당사는 관계 법령 준수 및 서비스 변경 사항 반영을 위해 본 방침을 정기적으로 업데이트할 수 있습니다. 업데이트된 방침은 상단의 "최종 업데이트" 날짜로 확인할 수 있습니다. 중요한 변경 사항의 경우, 앱 내 공지 또는 이메일을 통해 별도로 안내할 수 있습니다. 본 방침을 정기적으로 검토하시기 바랍니다.

제15조 - 문의 방법

clir.pbl2026@gmail.com

제16조 - 정보 접근, 정정 또는 삭제 방법

이용자는 당사가 수집한 개인정보에 대한 접근, 정정 또는 삭제를 요청할 권리가 있습니다. 요청은 clir.pbl2026@gmail.com을 통해 제출하거나 앱 내 계정 설정을 통해 직접 처리할 수 있습니다.`,
  },
  personalInfo: {
    id: 'personalInfo',
    title: '개인정보 수집 및 이용',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `이용자가 직접 제공하는 정보

당사는 이용자가 가입, 서비스 이용 또는 문의 제출 과정에서 직접 제공하는 정보를 수집합니다.

- 이름
- 이메일 주소
- 비밀번호
- 이용자가 설정한 알레르겐 및 식이 제한 프로필

당사는 민감한 정보를 수집하지 않습니다. 다만, 이용자가 입력한 알레르겐 및 식이 제한 정보는 건강 관련 정보에 해당할 수 있으며, 이는 서비스 제공 목적으로만 사용되고 제3자에게 판매되지 않습니다.

결제 정보

당사는 유료 서비스에 필요한 결제 정보를 수집할 수 있습니다. 결제 정보는 Apple Pay, Google Pay, Stripe 등 외부 결제 처리업체에 의해 처리되며, 당사는 결제 정보를 직접 저장하지 않습니다.

소셜 로그인 정보

소셜 미디어 계정을 통해 로그인하는 경우, 해당 플랫폼으로부터 이름, 이메일 주소, 프로필 사진 등 일부 프로필 정보를 수신할 수 있습니다.

앱 이용 중 자동으로 수집되는 정보

- 위치 정보: 위치 기반 서비스를 제공하기 위해 기기의 위치 정보에 접근할 수 있습니다. 기기 설정에서 권한을 변경할 수 있습니다.
- 카메라 접근: 바코드 스캔 및 OCR 기능을 제공하기 위해 카메라 접근 권한이 필요합니다.
- 기기 정보: 기기 ID, 모델, 제조사, OS 버전, IP 주소, 브라우저 유형 등 기술적 정보가 수집됩니다.
- 로그 및 이용 데이터: 서비스 접속 날짜 및 시간, 이용한 기능, 검색어, 오류 보고서가 수집됩니다.
- 푸시 알림: 계정 또는 서비스 관련 알림을 전송하기 위해 푸시 알림 권한을 요청할 수 있습니다. 기기 설정에서 거부할 수 있습니다.

이용자가 제공하는 모든 개인정보는 정확하고 완전해야 하며, 변경 사항이 있는 경우 당사에 통지해야 합니다.

정보 이용 방법

수집된 개인정보는 다음의 목적으로 처리됩니다.

- 계정 생성 및 관리: 이용자 계정의 생성, 인증 및 유지
- 서비스 제공: 알레르겐 분석, 식이 제한 필터링 및 대체 제품 추천 등 핵심 서비스 제공
- 고객 지원: 이용자의 문의 및 불만 처리
- 결제 및 주문 관리: 유료 서비스에 대한 결제 처리 및 관리
- 서비스 보안: 부정 이용 탐지 및 방지
- 서비스 개선: 이용 패턴 분석을 통한 서비스 품질 향상
- 집계 및 익명화 연구: 개인을 식별할 수 없는 형태로 처리된 통계 데이터 생성 및 분석`,
  },
  healthDisclaimer: {
    id: 'healthDisclaimer',
    title: '건강 면책 조항',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본 조항은 본 약관의 핵심 규정입니다. 서비스를 이용하기 전에 주의 깊게 읽어 주십시오.

앱의 분석 결과는 참고용입니다. 섭취 전 반드시 제품 라벨을 확인하세요.

4.1 정보의 정확성에 관한 면책

앱은 이용자에게 일반적이고 참고용 정보만을 제공합니다. 게시자는 앱에 표시된 데이터의 적절성, 정확성 또는 완전성을 보장하지 않습니다. 이러한 정보는 명시적 또는 묵시적 보증 없이 "있는 그대로(AS IS)" 및 "이용 가능한 상태로(AS AVAILABLE)" 제공됩니다. 게시자는 상품성, 특정 목적에의 적합성, 권원 및 비침해에 관한 모든 묵시적 보증을 명시적으로 부인합니다.

특히 게시자는 다음에 대한 법적 책임을 지지 않습니다.

- 데이터베이스에 포함된 식품 성분 정보의 오류, 누락 또는 불완전성
- 제조업체의 성분 변경, 제조법 수정 또는 라벨 업데이트가 데이터베이스에 반영되지 않은 경우
- OCR 인식 또는 바코드 스캔 중 발생하는 기술적 오류
- 교차 오염 또는 공동 제조 시설로 인한 알레르겐 오염 위험
- 동일한 제품명을 공유하는 여러 제품 간의 성분 차이로 인한 혼동
- 이용자의 특정 알레르기 민감도 또는 의학적 상태를 반영하지 못한 경우

4.2 이용자 확인 의무

이용자는 앱의 분석 결과를 검토한 후, 실제 섭취 전에 제품 포장의 성분 라벨을 직접 눈으로 확인할 의무가 있습니다. 앱의 정보는 최종 확인 수단이 아닌 보조적인 참고 자료로만 사용되어야 합니다. 게시자는 앱의 정보만을 근거로 한 식품 섭취로 인한 건강 피해에 대해 어떠한 책임도 지지 않습니다.

4.3 의료 책임 면책

본 서비스는 의료 기기가 아니며 의료 진단, 처방 또는 의료 조언을 대체하지 않습니다. 이용자는 의료 목적으로 본 앱을 사용해서는 안 됩니다. 특히 다음 사항을 유의하십시오.

- 심각한 식품 알레르기(아나필락시스 반응 가능성 포함)가 있는 이용자는 앱의 분석 결과만을 근거로 식품 섭취 결정을 내려서는 안 됩니다.
- 이용자는 앱에서 읽은 정보로 인해 의료 조언이나 전문 치료를 소홀히 하거나 지연해서는 안 됩니다.
- 건강에 우려 사항이 있는 경우, 반드시 의사 또는 영양 전문가와 상담해야 합니다.

4.4 손해 배상 제한

관계 법령이 허용하는 최대 범위 내에서, 게시자는 법적 근거(보증, 계약, 불법행위, 법령 또는 기타)를 불문하고 앱의 이용 또는 이용 불가로 인해 발생하거나 이와 관련된 모든 직접적, 간접적, 부수적, 특별, 결과적 또는 징벌적 손해(신체 상해, 재산 피해, 의료비, 일실 이익, 데이터 손실 포함)에 대해 책임을 지지 않습니다. 이는 게시자가 그러한 손해의 가능성에 대해 사전에 통지를 받은 경우에도 적용됩니다.

게시자의 책임이 인정되는 경우, 총액은 이용자가 연간 프리미엄 버전 구독에 실제로 지불한 금액을 초과하지 않으며, 무료 버전 이용자의 경우 미화 100달러를 초과하지 않습니다.

일부 관할권에서는 책임 제한을 허용하지 않으며, 이 경우 게시자의 책임은 관계 법령이 허용하는 최소한의 범위로만 인정됩니다.

4.5 앱 접근성에 관한 면책

게시자는 불가항력, 유지보수, 업데이트, 네트워크 장애, 정전 또는 유사한 사유로 인한 서비스의 기술적 불가용에 대해 책임을 지지 않습니다. 하드웨어 비호환성 또는 기타 사유로 인해 앱의 전부 또는 일부가 이용 불가능해지더라도 보상, 환불 또는 법적 책임이 발생하지 않습니다.

4.6 외부 리소스에 관한 면책

이용자는 앱을 통해 제3자가 운영하는 외부 리소스(과학 연구 자료 등)에 접근할 수 있습니다. 게시자는 그러한 외부 리소스의 콘텐츠 또는 가용성에 대한 통제권이 없으며, 해당 콘텐츠 또는 이용자의 이용으로 인해 발생하는 손해에 대해 책임을 지지 않습니다.`,
  },
  ageConfirm: {
    id: 'ageConfirm',
    title: '연령 확인',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본인은 만 13세 이상입니다.

연령 요건

본 서비스는 만 13세 미만의 아동을 대상으로 하지 않습니다. 앱을 이용함으로써 이용자는 만 13세 이상임을 확인합니다.

계정 생성 조건 (제5조 1항)

계정을 생성함으로써 이용자는 다음에 동의합니다.

- 봇 또는 자동화된 수단을 통한 계정 생성은 허용되지 않습니다.
- 별도의 승인 없이 각 이용자는 하나의 계정만 등록할 수 있습니다.
- 별도의 승인 없이 계정을 타인과 공유할 수 없습니다.

이용자는 비밀번호를 안전하게 관리할 전적인 책임이 있으며, 타인에게 비밀번호를 공유하거나 공개해서는 안 됩니다.

미성년자 보호

당사는 만 13세 미만의 아동으로부터 의도적으로 개인정보를 수집하지 않습니다. 만 13세 미만 아동의 정보가 수집된 사실을 인지하게 되면, 해당 정보를 신속하게 삭제하기 위한 조치를 취할 것입니다. 만 13세 미만의 아동이 당사 서비스를 이용하고 있다고 판단되는 경우, clir.pbl2026@gmail.com으로 신고해 주십시오.`,
  },
  marketing: {
    id: 'marketing',
    title: '마케팅 정보 수신',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본 항목은 선택 사항입니다. 거부하더라도 서비스 이용이 제한되지 않습니다.

마케팅 정보

동의하시면 이메일 또는 앱 내 알림을 통해 다음과 같은 마케팅 정보를 발송할 수 있습니다.

- 새로운 기능 및 서비스 업데이트 공지
- 프리미엄 버전 혜택 및 프로모션 정보
- 식품 알레르기 및 건강 관련 뉴스레터
- 앱 이용 팁 및 가이드

수신 거부 방법

마케팅 정보 수신에 동의한 후에도 언제든지 수신을 거부할 수 있습니다.

- 마케팅 이메일 하단의 수신 거부 링크를 클릭하는 방법
- 앱의 알림 설정에서 마케팅 알림을 비활성화하는 방법
- clir.pbl2026@gmail.com으로 수신 거부 요청을 보내는 방법

수신 거부 처리에는 영업일 기준 최대 10일이 소요될 수 있습니다. 마케팅 정보 수신을 거부한 후에도 서비스 이용과 직접적으로 관련된 거래성 알림(예: 계정 알림, 결제 영수증)은 계속 수신하게 됩니다.

마케팅 파트너

당사는 마케팅 이메일 발송을 위해 MailChimp, Brevo 등 외부 이메일 서비스를 이용합니다. 당사는 이러한 서비스와 데이터 보호 계약을 체결하였으며, 해당 서비스는 마케팅 목적 이외의 목적으로 이용자 정보를 사용하지 않습니다.`,
  },
  dataAnalytics: {
    id: 'dataAnalytics',
    title: '데이터 분석 활용 동의',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `본 항목은 선택 사항입니다. 거부하더라도 서비스 이용이 제한되지 않습니다.

수집 및 분석 목적

동의하시면 서비스 개선을 위해 익명화 및 집계된 이용 데이터를 분석합니다.

- 앱 이용 패턴 분석: 자주 사용하는 기능, 스캔 빈도, 검색 패턴 등
- 오류 및 성능 분석: 앱 충돌 로그, 응답 시간, 오류 빈도
- 사용자 경험 개선: UI/UX 개선을 위한 이용자 행동 데이터
- 서비스 개발: 새로운 기능 개발에 대한 수요 파악

사용하는 분석 도구

- Google Analytics for Firebase: 앱 이용 분석
- Firebase Performance Monitoring: 앱 성능 모니터링
- Crashlytics: 오류 및 충돌 보고

데이터 처리 방법

분석에 사용되는 데이터는 개인을 식별할 수 없는 형태로 처리됩니다. 수집된 데이터는 서비스 개선 목적으로만 사용되며 제3자에게 판매되지 않습니다. 분석 데이터는 최대 26개월 동안 보유됩니다. 게시자는 서비스 개선, 연구 및 사업 목적으로 익명화 또는 집계된 데이터를 제3자와 공유하거나 제공할 수 있으며, 직접적으로 식별 가능한 개인정보는 포함되지 않습니다.

동의 철회

분석 동의를 철회하려면 clir.pbl2026@gmail.com으로 연락하거나 앱 설정에서 분석 데이터 수집을 비활성화하십시오. Google Analytics 추적을 거부하려면 Google Analytics 옵트아웃 페이지를 방문하십시오.`,
  },
};

// ─── 스페인어 약관 ────────────────────────────────────────────────────────────

export const LEGAL_SECTIONS_ES: Record<TermsSectionKey, LegalSectionContent> = {
  terms: {
    id: 'terms',
    title: 'Términos de servicio',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `LEA ESTOS TÉRMINOS Y CONDICIONES DETENIDAMENTE.

Antes de registrarse en la aplicación, todos los usuarios deben leer detenidamente estos Términos y Condiciones ("Términos") y la Política de Privacidad. La Política de Privacidad y la Política de Usuario de Avisos forman parte inseparable de estos Términos. Al utilizar la aplicación, se considera que ha aceptado estos Términos en su totalidad. Si no está de acuerdo con alguna parte de estos Términos, no utilice la aplicación.

Estos Términos pueden modificarse en cualquier momento sin previo aviso. Los usuarios deben revisar estos Términos con regularidad, y el uso continuado de la aplicación tras cualquier modificación constituye la aceptación de los Términos revisados.

Estos Términos incluyen una cláusula de arbitraje obligatorio, lo que significa que usted acepta resolver los litigios relacionados con este Servicio mediante arbitraje privado vinculante en lugar de ante los tribunales. También incluyen una renuncia a acciones colectivas, lo que significa que acepta presentar litigios únicamente a título individual y no como acción colectiva.

El Artículo 4 de estos Términos regula el alcance de las exenciones de responsabilidad del Editor. Usted reconoce que la información sobre alérgenos y restricciones alimentarias proporcionada por la aplicación es solo de referencia, y que el Editor no garantiza la exactitud, idoneidad ni integridad de dicha información. No debe consumir alimentos basándose únicamente en la información de la aplicación, y está obligado a verificar personalmente las etiquetas de los productos antes del consumo. Acepta expresamente utilizar la aplicación bajo su propia responsabilidad.

Artículo 1 - Definiciones

Los siguientes términos clave se definen a los efectos de estos Términos:

- Aplicación: La aplicación móvil Clir y todas las pantallas y funciones relacionadas.
- Usuario: Cualquier persona que utilice la versión gratuita o de pago de la aplicación.
- Colaborador: Un usuario que añade o modifica información sobre alimentos en la Base de datos.
- Cliente: Un usuario que compra la versión Premium dentro de la aplicación.
- Base de datos: La colección de información sobre ingredientes y alérgenos de alimentos utilizada por la aplicación para el análisis y la provisión de información.
- Resultado del análisis: La información sobre la presencia de alérgenos y las restricciones dietéticas proporcionada por la aplicación a los usuarios.
- Alérgeno: Un ingrediente que puede desencadenar una reacción alérgica en determinados usuarios; las reacciones pueden variar según el individuo.
- Servicios: Todos los servicios de análisis, filtrado y recomendación proporcionados por Clir en relación con la información alimentaria.
- Editor: La entidad jurídica responsable del funcionamiento y la gestión de la aplicación Clir y su contenido.
- Versión Premium: Contenido digital de pago accesible mediante compra integrada en la aplicación.
- Tienda: Las plataformas en línea desde las que los usuarios descargan la aplicación (Google Play Store y Apple App Store).

Artículo 2 - Finalidad e independencia del servicio

2.1 Finalidad

El objetivo de Clir es ayudar a los usuarios con alergias, vegetarianos, veganos y personas con restricciones dietéticas específicas a comprender más fácilmente la información sobre los ingredientes de los productos alimenticios que consumen en su vida diaria, y apoyarles para que tomen mejores decisiones alimentarias de forma independiente. En concreto, Clir persigue los siguientes objetivos:

- Permitir a los usuarios verificar rápidamente si determinados alérgenos e ingredientes con restricción dietética están presentes
- Proporcionar información de referencia para ayudar a los usuarios a tomar decisiones sobre salud y dieta
- Concienciar a los consumidores sobre la transparencia de los ingredientes alimentarios

2.2 Independencia

El Editor no tiene ninguna relación contractual ni financiera con los fabricantes o distribuidores de productos alimenticios evaluados en la aplicación, y se esfuerza por mantener la objetividad en sus resultados de análisis.

- La aplicación puede mostrar publicidad; el contenido publicitario no influye en los resultados de análisis ni en las recomendaciones sobre productos específicos.
- Ninguna marca puede pagar al Editor para influir en los resultados de análisis de sus productos ni para mejorar su posición en las recomendaciones de la aplicación.
- El Editor puede compartir o proporcionar datos anonimizados o agregados a terceros con fines de mejora del servicio, investigación y negocios. Consulte la Política de Privacidad para obtener información detallada sobre la recogida y el uso de información personal.

Artículo 3 - Cómo funciona el servicio

3.1 Base de datos

Clir mantiene su propia base de datos que contiene información sobre numerosos productos alimenticios, construida a través de las contribuciones de los colaboradores e información disponible públicamente y datos proporcionados por los fabricantes. El Editor no garantiza la plena fiabilidad de la información sobre ingredientes alimentarios contenida en la Base de datos. La información proporcionada por la aplicación transmite la información de las etiquetas de los productos; el Editor no analiza directamente los ingredientes. Pueden producirse errores en los ingredientes o errores de reconocimiento.

3.2 Método de análisis

La aplicación recopila información alimentaria mediante tecnología de lectura de códigos de barras o OCR (reconocimiento óptico de caracteres), la compara con la Base de datos y proporciona información sobre la presencia de alérgenos y las restricciones dietéticas. Los siguientes casos pueden no estar incluidos en el ámbito de análisis de la aplicación:

- Contaminación cruzada en las instalaciones de fabricación
- Alérgenos indicados solo como declaraciones preventivas en las etiquetas (p. ej., "Puede contener")
- Ingredientes no indicados con exactitud en la etiqueta por el fabricante

3.3 Naturaleza de los resultados del análisis

Todos los resultados del análisis proporcionados por la aplicación son opiniones de referencia basadas en la Base de datos, y no reflejan las condiciones médicas, la sensibilidad a los alérgenos ni las circunstancias especiales de salud de cada usuario. Las reacciones pueden variar según el individuo incluso con el mismo ingrediente, y los resultados del análisis de la aplicación no garantizan un consumo seguro. Expresiones como "Seguro para consumir", "Usar con precaución" y "No consumir" son opiniones de referencia basadas en la información de la Base de datos y no son juicios médicos. El Editor no ofrece ninguna garantía sobre la seguridad o los beneficios para la salud de ningún producto en sí mismo.

3.4 Recomendaciones de productos alternativos

La aplicación puede recomendar productos alternativos que se ajusten al perfil de alérgenos o las restricciones dietéticas del usuario. Las recomendaciones se realizan de manera completamente neutral y objetiva; ninguna marca paga para influir en los resultados de las recomendaciones. Sin embargo, el Editor no garantiza que los productos recomendados cumplan todos los requisitos dietéticos del usuario, y los usuarios deben verificar personalmente los ingredientes de los productos recomendados también.

3.5 Versión Premium

La aplicación ofrece una Versión Premium como compra integrada, que incluye las siguientes funciones:

- Multi-Perfil: Crear y gestionar múltiples perfiles de restricción dietética. Cada perfil puede configurarse para miembros individuales de la familia o para diversas necesidades dietéticas.
- Escaneos ilimitados: Escanear y revisar los resultados del análisis de productos ilimitados sin el límite de escaneos de la versión gratuita.

Los términos y condiciones para la compra de la Versión Premium se detallan en el Artículo 8.

Artículo 5 - Cuentas

5.1 Creación de cuenta

Los usuarios pueden acceder a sus cuentas mediante la integración de inicio de sesión en redes sociales tras el registro. Al crear una cuenta, los usuarios aceptan lo siguiente:

- No está permitido crear cuentas mediante bots o medios automatizados.
- Sin autorización separada, cada usuario solo puede registrar una cuenta.
- Sin autorización separada, las cuentas no pueden compartirse con otras personas.

Los usuarios asumen plena responsabilidad de gestionar sus contraseñas de forma segura y no deben compartirlas ni divulgarlas a otros. Si cree que la información de su cuenta ha sido comprometida, debe notificarlo inmediatamente al Editor.

5.2 Suspensión o eliminación de cuenta

El Editor conserva la autoridad exclusiva y discrecional para suspender o eliminar las cuentas de los usuarios que infrinjan estos Términos en cualquier momento y sin previo aviso. Las cuentas inactivas durante más de un año también pueden ser objeto de eliminación. Dicha suspensión o eliminación no excluye el derecho del Editor a emprender acciones legales contra el usuario en cuestión.

5.3 Rescisión de cuenta por parte del usuario

Los usuarios pueden rescindir sus cuentas libremente en cualquier momento. Para rescindir su cuenta, solicítelo por correo electrónico al Editor o siga el procedimiento de eliminación dentro de la aplicación.

Artículo 6 - Derechos y obligaciones del usuario

6.1 Restricciones de uso

Los usuarios deben cumplir las leyes aplicables y estos Términos, y en particular no deben:

- Publicar contenido ilegal relacionado con difamación, amenazas, acoso, incitación al odio, discriminación, obscenidad o violencia
- Sondear vulnerabilidades de la aplicación, violar medidas de seguridad o insertar software malicioso
- Utilizar programas automatizados que interfieran con la infraestructura técnica de la aplicación o recopilen datos sin autorización
- Uso no autorizado de cuentas de otros usuarios o recopilación de información personal
- Utilizar los resultados de análisis y la información de recomendaciones proporcionados por la aplicación con fines comerciales

6.2 Añadir información alimentaria

Los usuarios pueden contribuir a la Base de datos añadiendo o modificando información alimentaria a través de la aplicación. Los colaboradores transfieren los derechos de propiedad intelectual de sus contribuciones al Editor, y el Editor puede distribuir o utilizar dicho contenido con fines comerciales y otros. Los colaboradores deben:

- Proporcionar únicamente información veraz al contribuir
- Añadir únicamente fotografías e información obtenidas personalmente; no está permitido copiar información de sitios web de terceros
- La información añadida debe verificarse directamente en el embalaje del producto real

6.3 Modificar información alimentaria

Los usuarios que descubran errores pueden modificar la información del producto correspondiente o informar del error al Editor. Los colaboradores que eliminen deliberadamente información precisa o introduzcan información falsa pueden tener sus cuentas suspendidas o eliminadas, y pueden ser objeto de acciones legales.

6.4 Responsabilidad de los usuarios y colaboradores

Los colaboradores asumen plena responsabilidad por el contenido que publican. Los usuarios aceptan indemnizar, defender y mantener indemne al Editor frente a todas las pérdidas, responsabilidades, daños, costes y gastos (incluidos los honorarios razonables de abogados) derivados de las infracciones de estos Términos.

Artículo 7 - Propiedad intelectual

7.1 Derechos del Editor

Todos los derechos de propiedad intelectual sobre los componentes que constituyen la aplicación, incluidos el contenido de la aplicación, la marca Clir, el logotipo, el software, la metodología de análisis, los algoritmos de recomendación, los elementos gráficos y la estructura de la base de datos, pertenecen al Editor y/o a terceros titulares de derechos. El Editor otorga a los usuarios una licencia no exclusiva y revocable para utilizar el sitio web y la aplicación. Esta licencia es estrictamente personal y no puede transferirse ni cederse a ningún tercero en ninguna circunstancia. Esta licencia no otorga derechos para acceder, utilizar ni divulgar el código fuente.

7.2 Propiedad intelectual de terceros

Las marcas, logotipos, imágenes, fotografías y textos de terceros que aparecen en la aplicación son propiedad exclusiva de sus respectivos autores y están protegidos por la legislación sobre derechos de autor, la legislación sobre marcas comerciales u otras leyes aplicables. Los usuarios no deben infringir dichos derechos de terceros ni utilizar dichos elementos sin autorización.

Artículo 8 - Compra de la Versión Premium

8.1 Servicio de venta

La Versión Premium está disponible para su compra como suscripción mensual a través de la Tienda y del sitio web.

8.2 Precios

Los precios mostrados en la aplicación y en el sitio web incluyen el IVA aplicable en el día de la compra. El Editor se reserva el derecho de ajustar los precios para reflejar los cambios en las tasas de IVA y puede modificar los precios en cualquier momento. Sin embargo, solo se aplica al cliente correspondiente el precio mostrado en la aplicación y en el sitio web el día de la compra.

8.3 Métodos de pago

Para las compras a través de la Tienda, el pago se procesa a través del método de pago registrado por el usuario en la Tienda, y los términos y condiciones de la Tienda prevalecen sobre estos Términos. Para las compras a través del sitio web, actualmente solo está disponible el pago con tarjeta de crédito.

8.4 Entrega y disponibilidad

Tras completarse el pago, el cliente recibirá un correo electrónico de confirmación del pedido y la Versión Premium estará disponible de inmediato. Si el acceso no está disponible tras la compra, comuníquese con nosotros en un plazo de 3 meses a partir de la fecha de compra.

8.5 Cancelación de la suscripción

La suscripción a la Versión Premium es válida por 30 días a partir de la fecha de compra y se renovará automáticamente por el mismo período si no se cancela antes del día anterior a la fecha de renovación. Los usuarios pueden cancelar su suscripción en cualquier momento durante el período de suscripción, pero en tal caso no se proporcionará ningún reembolso. Incluso tras la cancelación, las funciones Premium siguen siendo accesibles hasta la fecha de vencimiento de la suscripción. La cancelación de la suscripción puede realizarse a través de la Tienda utilizada en el momento de la suscripción o mediante solicitud por correo electrónico a clir.pbl2026@gmail.com.

Artículo 9 - Disposiciones generales

9.1 Modificaciones de los Términos

El Editor se reserva el derecho de modificar estos Términos en cualquier momento y sin previo aviso. Los Términos modificados entran en vigor 14 días después de su publicación en línea. El uso continuado del Servicio después de esa fecha constituye la aceptación de los Términos modificados. Si no está de acuerdo con los cambios, deje de utilizar el Servicio.

9.2 Separabilidad

Si alguna disposición de estos Términos es declarada inválida por ley, reglamento o sentencia judicial firme, las disposiciones restantes mantendrán plena vigencia y efecto.

9.3 No renuncia

Si el Editor se abstiene de ejercer algún derecho en una situación particular, esto no se interpretará como una renuncia a ese derecho.

Artículo 10 - Resolución de litigios y legislación aplicable

En caso de litigio relacionado con Clir, los usuarios aceptan dar primero al Editor la oportunidad de resolver el problema. Para ello, los usuarios deben enviar un aviso escrito ("Aviso de litigio") a clir.pbl2026@gmail.com o a la dirección del Editor, incluyendo la información de las partes, los hechos que dan origen al litigio y la resolución propuesta. Si el litigio no se resuelve en un plazo de 60 días desde la recepción del Aviso de litigio por parte del Editor, se aplicarán los siguientes procedimientos de resolución de litigios.

10.1 Arbitraje vinculante

Si un litigio no se resuelve mediante negociación informal, se resolverá mediante arbitraje vinculante. Usted renuncia a su derecho a presentar una demanda ante un juez o jurado, incluido el derecho a participar en una acción colectiva. Todos los litigios se resolverán ante un árbitro neutral, y la decisión del árbitro es definitiva, sujeta solo a derechos de apelación limitados en virtud de la Ley Federal de Arbitraje.

10.2 Renuncia a acciones colectivas

Todos los litigios deben presentarse a título individual. Tanto los usuarios como el Editor no pueden presentar ni proponer litigios en forma de acciones colectivas o acciones representativas. Si la legislación aplicable no permite una renuncia a acciones colectivas, esta se aplicará en la medida en que lo permita dicha legislación.

10.3 Procedimiento de arbitraje

El arbitraje se llevará a cabo de conformidad con las Normas de Arbitraje Comercial de la Asociación Americana de Arbitraje (AAA). Los usuarios aceptan iniciar el arbitraje únicamente en el lugar de negocios del Editor. Si la cuantía del litigio es de 10.000 USD o menos, la audiencia se realizará por teléfono. Todas las reclamaciones o litigios deben presentarse en el plazo de un año desde la fecha en que surgieron por primera vez; las reclamaciones presentadas después de este plazo quedan vetadas de forma permanente.

Derecho a rechazar el arbitraje: Los usuarios que no estén de acuerdo con esta cláusula de arbitraje deben enviar un aviso escrito a clir.pbl2026@gmail.com en un plazo de 30 días a partir de la primera recepción de estos Términos, indicando su nombre, dirección e intención clara de no arbitrar. El rechazo de la cláusula de arbitraje no resultará en ninguna desventaja para la relación de servicio del usuario.

10.4 Legislación aplicable y jurisdicción

Estos Términos se interpretarán de conformidad con las leyes del país en el que se encuentra el Editor. Para los asuntos no sujetos a arbitraje o relacionados con la ejecución de un laudo arbitral, los tribunales del lugar del Editor tendrán jurisdicción exclusiva.

Si no está de acuerdo con estos Términos, no utilice este Servicio. Al instalar o utilizar la aplicación, se considera que ha aceptado irrevocablemente estos Términos en su totalidad.

Contacto: clir.pbl2026@gmail.com`,
  },
  privacy: {
    id: 'privacy',
    title: 'Política de privacidad',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Esta Política de Privacidad explica cómo Clir ("nosotros") recopila, almacena, utiliza y comparte la información personal de los usuarios en el curso de la prestación de los Servicios. Esta Política se aplica cuando:

- Descarga o utiliza la aplicación móvil Clir
- Visita nuestro sitio web
- Interactúa con nosotros a través de atención al cliente, encuestas u otros medios

Si tiene preguntas, contáctenos en clir.pbl2026@gmail.com. Si no está de acuerdo con esta Política, no utilice el Servicio.

Artículo 1 - Tipos de información recopilada

Información proporcionada directamente por los usuarios

Recopilamos la información que los usuarios proporcionan directamente en el transcurso del registro, el uso del Servicio o el envío de consultas:

- Nombre
- Dirección de correo electrónico
- Contraseña
- Perfiles de alérgenos y restricciones dietéticas (establecidos por el usuario)

No recopilamos información sensible. Sin embargo, la información sobre alérgenos y restricciones dietéticas introducida por los usuarios puede constituir información relacionada con la salud, que se utiliza únicamente con el fin de prestar los Servicios y no se vende a terceros.

Información de pago

Podemos recopilar información de pago necesaria para los Servicios de pago. La información de pago es procesada por procesadores de pago externos como Apple Pay, Google Pay y Stripe; no almacenamos directamente la información de pago.

Información de inicio de sesión social

Al iniciar sesión a través de una cuenta de redes sociales, podemos recibir determinada información de perfil de esa plataforma, incluido su nombre, dirección de correo electrónico e imagen de perfil.

Información recopilada automáticamente durante el uso de la aplicación

- Información de ubicación: Podemos acceder a la información de ubicación de su dispositivo para prestar servicios basados en la ubicación. Puede cambiar los permisos en la configuración de su dispositivo.
- Acceso a la cámara: Se requiere permiso de acceso a la cámara para proporcionar funciones de lectura de códigos de barras y OCR.
- Información del dispositivo: Se recopila información técnica como el ID del dispositivo, el modelo, el fabricante, la versión del SO, la dirección IP y el tipo de navegador.
- Datos de registro y uso: Se recopilan la fecha y hora de acceso al servicio, las funciones utilizadas, los términos de búsqueda y los informes de errores.
- Notificaciones push: Podemos solicitar permisos de notificación push para enviar notificaciones relacionadas con la cuenta o el servicio. Puede rechazarlo en la configuración de su dispositivo.

Toda la información personal proporcionada por los usuarios debe ser exacta y completa, y los usuarios deben notificarnos cualquier cambio.

Artículo 2 - Cómo procesamos la información

La información personal recopilada se procesa con los siguientes fines:

- Creación y gestión de cuentas: Crear, autenticar y mantener cuentas de usuario
- Prestación del servicio: Prestar servicios básicos que incluyen análisis de alérgenos, filtrado de restricciones dietéticas y recomendaciones de productos alternativos
- Atención al cliente: Gestionar las consultas y reclamaciones de los usuarios
- Gestión de pagos y pedidos: Procesar y gestionar los pagos de servicios de pago
- Seguridad del servicio: Detectar y prevenir el uso fraudulento
- Mejora del servicio: Mejorar la calidad del servicio mediante el análisis de patrones de uso
- Investigación agregada y anonimizada: Generar y analizar datos estadísticos procesados de forma que no puedan identificar a personas

Artículo 3 - Base legal para el procesamiento de la información

Para residentes en la UE/RU

Procesamos información personal bajo las siguientes bases legales de conformidad con el RGPD y el RGPD del RU:

- Consentimiento: Cuando usted ha consentido el tratamiento de información personal para una finalidad específica. El consentimiento puede retirarse en cualquier momento.
- Ejecución de un contrato: Cuando sea necesario para la ejecución de un acuerdo de servicio
- Intereses legítimos: Cuando sea necesario para nuestros intereses comerciales legítimos, como la prevención del fraude y la mejora del servicio
- Obligación legal: Cuando sea necesario para cumplir con las leyes aplicables
- Intereses vitales: Cuando sea necesario para proteger la vida o la seguridad de los usuarios o terceros

Para residentes en Canadá

Procesamos información personal basándonos en el consentimiento expreso o implícito, y podemos procesar sin consentimiento cuando lo permita la ley.

Artículo 4 - Compartir información personal con terceros

Solo podemos compartir información personal con terceros en las siguientes circunstancias:

Proveedores de servicios

Compartimos información con los siguientes proveedores de servicios externos en la medida necesaria para el funcionamiento del Servicio, y hemos celebrado acuerdos de protección de datos con ellos:

- Servicios en la nube: Google Cloud Platform
- Comunicaciones con usuarios: MailChimp, Brevo, etc.
- Procesamiento de pagos: Apple Pay, Google Pay, Stripe
- Autenticación de cuentas: Firebase Authentication, Facebook Login, etc.
- Análisis de la aplicación: Google Analytics for Firebase
- Supervisión del rendimiento: Firebase Performance Monitoring, Crashlytics
- Distribución de la aplicación: App Store Connect, Google Play Store

Transferencias comerciales

La información personal puede transferirse en relación con fusiones, adquisiciones o ventas de activos.

Afiliados

Podemos compartir información con nuestros afiliados, y en tales casos, exigimos a dichos afiliados que cumplan con esta Política. No hemos vendido ni compartido información personal de usuarios con terceros con fines comerciales en los últimos 12 meses.

Artículo 5 - Cookies y tecnologías de seguimiento

Podemos utilizar cookies y tecnologías de seguimiento similares para mantener la seguridad del servicio, corregir errores y guardar la configuración del usuario. Los proveedores de servicios de terceros también pueden utilizar tecnologías de seguimiento con fines analíticos. La mayoría de los navegadores web aceptan cookies de forma predeterminada, y puede rechazarlas a través de la configuración de su navegador. Sin embargo, rechazar las cookies puede limitar ciertas funciones del servicio.

Utilizamos Google Analytics para analizar el uso del servicio. Para optar por no participar en el seguimiento de Google Analytics, visite la página de exclusión de Google Analytics.

Artículo 6 - Funciones basadas en IA

Utilizamos tecnologías de inteligencia artificial y aprendizaje automático para funciones como el reconocimiento de códigos de barras, el OCR (análisis de imágenes) y el análisis de texto de ingredientes. Estas funciones pueden implementarse a través de proveedores de servicios de IA externos como OpenAI y Google Cloud AI, y la información utilizada en dicho procesamiento está protegida de conformidad con esta Política y nuestros acuerdos con dichos proveedores de servicios.

Artículo 7 - Procesamiento de inicio de sesión social

Al iniciar sesión a través de una cuenta de redes sociales (Facebook, Google, etc.), podemos recibir información como su nombre, dirección de correo electrónico e imagen de perfil de esa plataforma. La información recibida se utiliza únicamente para los fines especificados en esta Política. No somos responsables de las prácticas de información personal de plataformas de redes sociales de terceros; revise directamente las políticas de privacidad de dichas plataformas.

Artículo 8 - Transferencia internacional de información

Nuestros servidores pueden estar ubicados en Estados Unidos, los Países Bajos y otros países. Su información personal puede transferirse y almacenarse o procesarse en regiones fuera de su país de residencia. Para residentes en la UE/RU/Suiza, las leyes de protección de datos de los países a los que se transfiere la información pueden diferir de las de su país de residencia. Protegemos la información personal mediante salvaguardias adecuadas, como las Cláusulas Contractuales Estándar de la Comisión Europea.

Artículo 9 - Período de retención de la información

Conservamos la información personal mientras su cuenta permanezca activa. Cuando haya finalizado el propósito de la retención, eliminamos o anonimizamos la información a menos que estemos obligados legalmente a conservarla. La información almacenada en archivos de copia de seguridad que no pueden eliminarse de inmediato se gestiona mediante aislamiento seguro.

Artículo 10 - Cómo protegemos la información

Implementamos medidas de seguridad técnicas y administrativas adecuadas para proteger la información personal. Sin embargo, dado que la transmisión electrónica a través de Internet y las tecnologías de almacenamiento de información no pueden garantizar una seguridad del 100%, no podemos excluir completamente la posibilidad de brechas de seguridad por parte de piratas informáticos, ciberdelincuentes u otros terceros no autorizados. Acceda al Servicio únicamente desde un entorno seguro.

Artículo 11 - Derechos del usuario

Dependiendo de su país de residencia, puede tener los siguientes derechos:

- Derecho a solicitar acceso sobre si su información personal está siendo procesada y cómo
- Derecho a solicitar la corrección de información personal
- Derecho a solicitar la eliminación de información personal
- Derecho a solicitar la restricción del procesamiento de información personal
- Derecho a la portabilidad de datos
- Derecho a oponerse a la toma de decisiones automatizada
- Derecho a retirar el consentimiento al procesamiento de información personal

Para ejercer sus derechos, contáctenos en clir.pbl2026@gmail.com. Revisaremos y procesaremos su solicitud de conformidad con las leyes aplicables.

Cambios en la información de la cuenta y baja

Para cambiar la información de la cuenta o darse de baja del Servicio, envíe una solicitud a través de la configuración de la cuenta en la aplicación o por correo electrónico. Tras la baja, su cuenta e información relacionada se eliminarán de la base de datos activa, pero parte de la información puede conservarse con fines de prevención del fraude, obligaciones legales y similares.

Retirada del consentimiento

Para retirar su consentimiento al procesamiento de información personal, contáctenos en clir.pbl2026@gmail.com. La retirada del consentimiento no afecta a la legalidad del procesamiento llevado a cabo antes de la retirada.

Artículo 12 - No rastrear

Algunos navegadores web y sistemas operativos móviles proporcionan una función de No rastrear (DNT) que envía una señal indicando que no desea ser rastreado en línea. Dado que actualmente no existe un estándar técnico unificado para las señales DNT, actualmente no respondemos a las señales DNT. Si en el futuro se adopta un estándar, lo notificaremos a través de esta Política.

Artículo 13 - Derechos específicos para residentes en EE. UU.

Los residentes de California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah y Virginia pueden tener los siguientes derechos adicionales:

- Derecho a verificar si se está procesando información personal y cómo
- Derecho a acceder a información personal
- Derecho a corregir información personal
- Derecho a eliminar información personal
- Derecho a solicitar una copia de la información personal previamente compartida
- Derecho a no ser discriminado por ejercer derechos
- Derecho a optar por no participar en el procesamiento utilizado para publicidad dirigida, venta de información personal o elaboración de perfiles que produzca efectos legales significativos

Cómo ejercer los derechos

Para ejercer sus derechos, contáctenos en clir.pbl2026@gmail.com. Es posible que se requiera verificación de identidad para procesar su solicitud. Para las solicitudes presentadas por un agente autorizado, se llevará a cabo un procedimiento para verificar la autorización adecuada.

Proceso de apelación

Si su solicitud es denegada, puede apelar a clir.pbl2026@gmail.com. Si su apelación es rechazada, puede presentar una queja ante el fiscal general de su estado de residencia.

Ley Shine the Light de California

Los residentes de California pueden solicitar, una vez al año sin cargo, una lista de las categorías de información personal compartida con terceros con fines de marketing directo y los nombres de dichos terceros. Envíe las solicitudes a clir.pbl2026@gmail.com.

Artículo 14 - Actualizaciones de esta Política de Privacidad

Podemos actualizar esta Política periódicamente para cumplir con las leyes aplicables y reflejar los cambios en el servicio. Las políticas actualizadas pueden identificarse por la fecha de "Última actualización" en la parte superior. Para cambios significativos, podemos proporcionar un aviso separado a través de anuncios en la aplicación o por correo electrónico. Revise esta Política con regularidad.

Artículo 15 - Cómo contactar con nosotros

clir.pbl2026@gmail.com

Artículo 16 - Cómo acceder, corregir o eliminar información

Los usuarios tienen derecho a solicitar el acceso, la corrección o la eliminación de la información personal que hemos recopilado. Las solicitudes pueden enviarse a través de clir.pbl2026@gmail.com o procesarse directamente a través de la configuración de la cuenta en la aplicación.`,
  },
  personalInfo: {
    id: 'personalInfo',
    title: 'Recopilación y uso de información personal',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Información proporcionada directamente por los usuarios

Recopilamos la información que los usuarios proporcionan directamente en el transcurso del registro, el uso del Servicio o el envío de consultas:

- Nombre
- Dirección de correo electrónico
- Contraseña
- Perfiles de alérgenos y restricciones dietéticas (establecidos por el usuario)

No recopilamos información sensible. Sin embargo, la información sobre alérgenos y restricciones dietéticas introducida por los usuarios puede constituir información relacionada con la salud, que se utiliza únicamente con el fin de prestar los Servicios y no se vende a terceros.

Información de pago

Podemos recopilar información de pago necesaria para los Servicios de pago. La información de pago es procesada por procesadores de pago externos como Apple Pay, Google Pay y Stripe; no almacenamos directamente la información de pago.

Información de inicio de sesión social

Al iniciar sesión a través de una cuenta de redes sociales, podemos recibir determinada información de perfil de esa plataforma, incluido su nombre, dirección de correo electrónico e imagen de perfil.

Información recopilada automáticamente durante el uso de la aplicación

- Información de ubicación: Podemos acceder a la información de ubicación de su dispositivo para prestar servicios basados en la ubicación. Puede cambiar los permisos en la configuración de su dispositivo.
- Acceso a la cámara: Se requiere permiso de acceso a la cámara para proporcionar funciones de lectura de códigos de barras y OCR.
- Información del dispositivo: Se recopila información técnica como el ID del dispositivo, el modelo, el fabricante, la versión del SO, la dirección IP y el tipo de navegador.
- Datos de registro y uso: Se recopilan la fecha y hora de acceso al servicio, las funciones utilizadas, los términos de búsqueda y los informes de errores.
- Notificaciones push: Podemos solicitar permisos de notificación push para enviar notificaciones relacionadas con la cuenta o el servicio. Puede rechazarlo en la configuración de su dispositivo.

Toda la información personal proporcionada por los usuarios debe ser exacta y completa, y los usuarios deben notificarnos cualquier cambio.

Cómo utilizamos su información

La información personal recopilada se procesa con los siguientes fines:

- Creación y gestión de cuentas: Crear, autenticar y mantener cuentas de usuario
- Prestación del servicio: Prestar servicios básicos que incluyen análisis de alérgenos, filtrado de restricciones dietéticas y recomendaciones de productos alternativos
- Atención al cliente: Gestionar las consultas y reclamaciones de los usuarios
- Gestión de pagos y pedidos: Procesar y gestionar los pagos de servicios de pago
- Seguridad del servicio: Detectar y prevenir el uso fraudulento
- Mejora del servicio: Mejorar la calidad del servicio mediante el análisis de patrones de uso
- Investigación agregada y anonimizada: Generar y analizar datos estadísticos procesados de forma que no puedan identificar a personas`,
  },
  healthDisclaimer: {
    id: 'healthDisclaimer',
    title: 'Aviso de salud',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Esta es una disposición clave de estos Términos. Léala detenidamente antes de utilizar el Servicio.

El análisis de la aplicación es solo orientativo. Compruebe siempre la etiqueta del producto antes de consumirlo.

4.1 Exención de responsabilidad sobre la exactitud de la información

La aplicación proporciona información general y de referencia únicamente a los usuarios. El Editor no garantiza la idoneidad, exactitud ni integridad de los datos mostrados en la aplicación. Dicha información se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías expresas ni implícitas. El Editor renuncia expresamente a todas las garantías implícitas de comerciabilidad, idoneidad para un fin particular, título y no infracción.

En particular, el Editor no acepta ninguna responsabilidad legal por:

- Errores, omisiones o incompletitud de la información sobre ingredientes alimentarios contenida en la Base de datos
- Casos en los que los cambios de ingredientes del fabricante, las modificaciones de la fórmula o las actualizaciones de la etiqueta no se reflejan en la Base de datos
- Errores técnicos que se producen durante el reconocimiento OCR o la lectura de códigos de barras
- Riesgo de contaminación por alérgenos debido a contaminación cruzada o instalaciones de fabricación compartidas
- Confusión derivada de diferencias de ingredientes entre varios productos que comparten el mismo nombre de producto
- No tener en cuenta la sensibilidad alérgica específica o la condición médica de un usuario

4.2 Obligación de verificación del usuario

Tras revisar los resultados del análisis de la aplicación, los usuarios están obligados a verificar personalmente la etiqueta de ingredientes del envase del producto con sus propios ojos antes del consumo real. La información de la aplicación debe utilizarse únicamente como referencia complementaria, no como herramienta de verificación final. El Editor no asume ninguna responsabilidad por daños a la salud derivados del consumo de alimentos basándose únicamente en la información de la aplicación.

4.3 Exención de responsabilidad médica

Este Servicio no es un dispositivo médico y no reemplaza el diagnóstico médico, la prescripción ni el asesoramiento médico. Los usuarios no deben utilizar esta aplicación con fines médicos. En particular:

- Los usuarios con alergias alimentarias graves (incluida la posibilidad de reacciones anafilácticas) no deben tomar decisiones sobre el consumo de alimentos basándose únicamente en los resultados del análisis de la aplicación.
- Los usuarios no deben descuidar ni retrasar la búsqueda de asesoramiento médico o tratamiento profesional por información leída en la aplicación.
- Si tiene problemas de salud, debe consultar a un médico o especialista en nutrición.

4.4 Limitación de daños

En la máxima medida permitida por la legislación aplicable, el Editor no será responsable de ningún daño directo, indirecto, incidental, especial, consecuente o punitivo (incluidas lesiones físicas, daños a la propiedad, gastos médicos, lucro cesante y pérdida de datos) que surja de o esté relacionado con el uso o la imposibilidad de usar la aplicación, independientemente de la base legal (garantía, contrato, agravio, ley u otro), incluso si el Editor ha sido previamente informado de la posibilidad de tales daños.

Si se establece la responsabilidad del Editor, el importe total no superará el importe que el usuario pagó efectivamente por una suscripción anual a la Versión Premium; para los usuarios de la versión gratuita, esto no superará los 100 USD.

Algunas jurisdicciones no permiten limitaciones de responsabilidad, en cuyo caso la responsabilidad del Editor solo se reconocerá en la medida mínima permitida por la legislación aplicable.

4.5 Exención de responsabilidad sobre la accesibilidad de la aplicación

El Editor no será responsable de la no disponibilidad técnica del Servicio debido a fuerza mayor, mantenimiento, actualizaciones, fallos de red, cortes de electricidad o eventos similares. Si toda o parte de la aplicación deja de estar disponible debido a incompatibilidad de hardware u otras razones, no surgirán compensaciones, reembolsos ni responsabilidad legal.

4.6 Exención de responsabilidad sobre recursos externos

A través de la aplicación, los usuarios pueden acceder a recursos externos operados por terceros (como materiales de investigación científica). El Editor no tiene control sobre el contenido o la disponibilidad de dichos recursos externos, y no es responsable de ningún daño derivado de su contenido o del uso de los mismos por parte de los usuarios.`,
  },
  ageConfirm: {
    id: 'ageConfirm',
    title: 'Verificación de edad',
    required: true,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Tengo 13 años de edad o más.

Requisito de edad

Este Servicio no está destinado a niños menores de 13 años. Al utilizar la aplicación, usted confirma que tiene 13 años de edad o más.

Condiciones de creación de cuenta (Artículo 5.1)

Al crear una cuenta, los usuarios aceptan lo siguiente:

- No está permitido crear cuentas mediante bots o medios automatizados.
- Sin autorización separada, cada usuario solo puede registrar una cuenta.
- Sin autorización separada, las cuentas no pueden compartirse con otras personas.

Los usuarios asumen plena responsabilidad de gestionar sus contraseñas de forma segura y no deben compartirlas ni divulgarlas a otros.

Protección de menores

No recopilamos intencionalmente información personal de niños menores de 13 años. Si nos damos cuenta de que se ha recopilado información de un niño menor de 13 años, tomaremos medidas para eliminar prontamente dicha información. Si cree que un niño menor de 13 años está utilizando nuestro Servicio, notifíquenos en clir.pbl2026@gmail.com.`,
  },
  marketing: {
    id: 'marketing',
    title: 'Comunicaciones de marketing',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Este elemento es opcional. Rechazarlo no restringirá su uso del Servicio.

Información de marketing

Si da su consentimiento, podemos enviar los siguientes tipos de información de marketing por correo electrónico o notificaciones en la aplicación:

- Anuncios de nuevas funciones y actualizaciones del servicio
- Beneficios de la Versión Premium e información promocional
- Boletines informativos sobre alergias alimentarias y salud
- Consejos y guías de uso de la aplicación

Cómo darse de baja

Incluso después de dar su consentimiento para las comunicaciones de marketing, puede darse de baja en cualquier momento:

- Haciendo clic en el enlace de cancelación de suscripción en la parte inferior de un correo electrónico de marketing
- Desactivando las notificaciones de marketing en la configuración de notificaciones de la aplicación
- Enviando una solicitud de baja a clir.pbl2026@gmail.com

El procesamiento de la baja puede tardar hasta 10 días hábiles. Incluso después de darse de baja de las comunicaciones de marketing, seguirá recibiendo notificaciones transaccionales directamente relacionadas con su uso del Servicio (p. ej., notificaciones de cuenta, recibos de pago).

Socios de marketing

Utilizamos servicios de correo electrónico externos como MailChimp y Brevo para enviar correos electrónicos de marketing. Hemos celebrado acuerdos de protección de datos con estos servicios, y no utilizan la información del usuario para ningún fin que no sea el marketing.`,
  },
  dataAnalytics: {
    id: 'dataAnalytics',
    title: 'Consentimiento de análisis de datos',
    required: false,
    lastUpdated: LEGAL_LAST_UPDATED,
    body: `Este elemento es opcional. Rechazarlo no restringirá su uso del Servicio.

Propósitos de recopilación y análisis

Si da su consentimiento, analizamos datos de uso anonimizados y agregados para mejorar nuestros Servicios:

- Análisis de patrones de uso de la aplicación: funciones de uso frecuente, frecuencia de escaneo, patrones de búsqueda, etc.
- Análisis de errores y rendimiento: registros de fallos de la aplicación, tiempos de respuesta, frecuencia de errores
- Mejora de la experiencia del usuario: datos de comportamiento del usuario para mejoras de UI/UX
- Desarrollo del servicio: comprensión de la demanda para el desarrollo de nuevas funciones

Herramientas de análisis que utilizamos

- Google Analytics for Firebase: Análisis del uso de la aplicación
- Firebase Performance Monitoring: Supervisión del rendimiento de la aplicación
- Crashlytics: Informes de errores y fallos

Cómo se procesan los datos

Los datos utilizados para el análisis se procesan de forma que no pueden identificar a personas. Los datos recopilados se utilizan únicamente con fines de mejora del servicio y no se venden a terceros. Los datos de análisis se conservan durante un máximo de 26 meses. El Editor puede compartir o proporcionar datos anonimizados o agregados a terceros con fines de mejora del servicio, investigación y negocios; no se incluye información personal directamente identificable.

Retirada del consentimiento

Para retirar su consentimiento de análisis, contáctenos en clir.pbl2026@gmail.com o desactive la recopilación de datos de análisis en la configuración de la aplicación. Para optar por no participar en el seguimiento de Google Analytics, visite la página de exclusión de Google Analytics.`,
  },
};

// ─── 언어별 약관 반환 함수 ────────────────────────────────────────────────────

export function getLegalSections(lang: string): Record<TermsSectionKey, LegalSectionContent> {
  if (lang === 'ko') return LEGAL_SECTIONS_KO;
  if (lang === 'es') return LEGAL_SECTIONS_ES;
  return LEGAL_SECTIONS;
}
