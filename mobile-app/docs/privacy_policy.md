# LUNO Data Privacy Policy

**Last updated:** December 24, 2025

This Data Privacy Policy explains how **LUNO** (“LUNO,” “we,” “our,” “us”) collects, uses, stores, protects, shares, and deletes information when you use the **LUNO mobile application** (the “App”) and LUNO’s designated hardware devices (the “LUNO Toys”).

We wrote this policy in clear language so it’s easy to understand. If you have any questions, contact us at **auracampusapp@gmail.com**.

---

## 1) Scope & Definitions

### 1.1 What this policy covers

This policy applies to:

- The LUNO mobile app (iOS and Android)
- Hardware pairing, setup, and use with LUNO Toys
- Cloud services used by the App (including Firebase/Firestore and other infrastructure needed to operate the service)
- AI-powered features used to generate responses and experiences
- Data transmitted to and stored on LUNO Toy hardware devices

### 1.2 What this policy does not cover

This policy does not cover:

- Third-party sites/services you access from the App (their own policies apply)
- Apple’s policies (e.g., iCloud, App Store, Apple ID), which are governed by Apple’s terms

### 1.3 Key terms

- **Personal Data**: Information that identifies or can reasonably be linked to you (directly or indirectly).
- **User Content**: Messages, prompts, and any text/audio you provide.
- **Child Profile**: A profile that a parent/guardian may create in the App for personalization (e.g., name/age/learning preferences).
- **Device Identifier**: Unique identifiers associated with the LUNO Toy or the App installation (e.g., toy ID, internal IDs).
- **Processing**: Anything done with data (collection, storage, use, deletion, etc.).

---

## 2) Data We Collect

We collect information to run the App, connect to the hardware, and provide the features you expect. The exact data collected depends on which features you use.

### 2.1 Account & Authentication Data

Collected to allow you to sign in and secure your account.

- Email address (or login credential identifier)
- Account ID (internal identifier)
- Authentication tokens (used to keep you logged in securely)

**We do not** store your Apple ID password or other external provider passwords in LUNO.

### 2.2 Child / Family Data (If You Create Child Profiles)

Collected only if you choose to add it.

- Child profile name
- Birth date (MM/DD/YYYY format)
- Avatar/emoji selection
- Age level (preschool, elementary, upper)
- Gender (optional)
- Interests and preferences you set
- Assigned LUNO Toys associated with the child profile

**Parental Control Settings:**
- Daily time limit preferences
- Content filter settings and blocked topics (violence, mature content, politics, religion, personal info)
- Quiet hours schedules
- Alert preferences (personal info sharing, inappropriate content, emotional distress, unusual patterns)
- Alert sensitivity level (Low, Medium, High)
- Conversation recording preference
- Creative mode settings

> Parents/guardians should avoid entering sensitive information into child profiles.

### 2.3 Hardware & Connectivity Data (LUNO Toy Pairing/Use)

Collected to pair, connect, and maintain interaction with your LUNO Toy.

- LUNO Toy unique identifier (device ID)
- Bluetooth connection status and session metadata
- Firmware version and model information
- App device metadata needed for compatibility (e.g., OS/app version)
- Battery level and charging status
- Device settings (volume, LED brightness, sound effects, voice type preferences)
- Connection type (Wi-Fi or Bluetooth)
- Last connection timestamp

### 2.4 WiFi Network Configuration (During Toy Setup)

**IMPORTANT:** During the initial setup of your LUNO Toy, the App collects and transmits WiFi network credentials to enable the toy to connect to the internet.

**What we collect:**
- WiFi network name (SSID)
- WiFi password
- Your email address (sent to the toy for backend authentication)
- List of available WiFi networks detected by the toy (network names, signal strength, security type)

**How this data is used:**
- WiFi credentials are transmitted directly to your LUNO Toy via Bluetooth during setup
- The toy stores the WiFi network name (SSID) to maintain its connection
- Your email address is stored on the toy to authenticate requests to LUNO backend services
- We store the WiFi network name in our cloud database to show connection status

**Important security notes:**
- WiFi passwords are transmitted securely over Bluetooth and are NOT stored in LUNO's cloud services
- WiFi passwords remain only on your local toy device
- The toy uses your email address to associate conversations and data with your account

### 2.5 Conversation & Interaction Data

Collected to provide conversation continuity and features like history and parental review (where applicable).

**What we collect for each conversation:**
- Full conversation transcripts (all messages between child and toy)
- Individual message content, sender (child or toy), and timestamps
- Conversation metadata: start time, end time, duration, message count
- Conversation type (conversation, story, game, learning)
- Conversation title
- Child and toy names associated with the conversation

**Safety and monitoring data:**
- Flagged conversations that require parental review
- Flag reasons and types (personal info sharing, inappropriate content, emotional distress, unusual behavior)
- Flag severity level (low, medium, high, critical)
- Flag review status (reviewed or unreviewed)
- Individual flagged messages within conversations
- Message previews for flagged content

**Aggregate usage statistics:**
- Total number of conversations
- Total conversation duration (in seconds)
- Number of flagged conversations
- Last conversation timestamp
- Last flagged conversation timestamp

> This data is only collected if you enable conversation recording in parental controls. You can disable this feature at any time.

### 2.6 Location Permission (Bluetooth Discovery Requirement)

On iOS and Android, **Bluetooth discovery can require location permission** at the OS level.

- We request **Location When In Use** permission (iOS) or **Fine Location** permission (Android) to support Bluetooth scanning for LUNO Toys
- We **do not** collect, store, or track your precise GPS location
- We **do not** use location data for advertising or tracking purposes
- Location permission is used exclusively for Bluetooth device discovery as required by the operating system

### 2.7 Diagnostics, Logs, and Performance Data

Collected to keep the App stable and improve reliability.

- Crash reports
- Error logs (e.g., network failures, pairing failures)
- Performance metrics
- Basic usage metrics related to feature functionality

We minimize logging and avoid collecting sensitive information in logs where possible.

### 2.8 Data You Choose to Provide via Support

If you email support, we may collect:

- Your contact info (email)
- The details you share (screenshots, logs you send us)
- Device/app details needed to resolve the issue

---

## 3) How We Use Data (Purposes)

We use collected data only for the following purposes:

### 3.1 Provide Core App Functionality

- Create and maintain your account
- Save your settings
- Sync data across devices (if enabled)
- Show conversation history (if enabled)

### 3.2 Enable Hardware Pairing & Hardware-Based Workflows

- Discover and pair with a LUNO Toy using Bluetooth
- Complete setup and onboarding
- Support toy interaction and communication workflows

### 3.3 Generate AI-Powered Responses (If Enabled)

- Process prompts and context required to generate a response
- Provide continuity for experiences (e.g., story progression, personalization)

### 3.4 Safety, Security, and Abuse Prevention

- Prevent unauthorized access
- Detect abuse or suspicious activity
- Enforce restrictions and protect users

### 3.5 Troubleshooting, Debugging, and Performance Improvements

- Identify and fix bugs
- Improve stability and reliability
- Validate feature behavior across devices/OS versions

### 3.6 Legal and Compliance

- Respond to lawful requests
- Comply with legal obligations where required

---

## 4) Data Storage & Infrastructure

### 4.1 Where data is stored

LUNO uses cloud infrastructure to store and synchronize data. This may include:

- **Firebase / Firestore** for user records, device associations, and message history (where enabled)
- Associated cloud services required to operate the App securely (e.g., authentication, storage, logging)

### 4.2 Data segregation

We aim to keep user data separated by account and enforce access controls so that:

- Users can only access their own data (and any profiles under their account)
- Administrative access is limited and logged

### 4.3 Encryption

- **In transit:** Data transmitted between the App and servers/services is protected using **HTTPS/TLS**.
- **At rest:** Data stored in our cloud infrastructure is protected using industry-standard encryption mechanisms provided by our infrastructure.

---

## 5) Bluetooth & Location Privacy Details

### 5.1 Bluetooth usage

Bluetooth is used to:

- Detect nearby LUNO Toys during pairing
- Establish secure connection between App and toy
- Transmit WiFi credentials to the toy during initial setup
- Read device ID and status information from the toy
- Scan for available WiFi networks (via the toy's WiFi hardware)
- Monitor connection status during setup

**Data transmitted to toy via Bluetooth:**
- WiFi network name (SSID) and password
- Your email address (for backend authentication)
- Setup commands and configuration requests

### 5.2 Location permission explanation (iOS and Android requirement)

Both iOS and Android require location permission for Bluetooth scanning.

- We request **Location When In Use** (iOS) or **Fine Location** (Android) permission
- This permission is required by the operating system to scan for Bluetooth devices
- We do not use location permission for tracking, advertising, or GPS location collection
- We do not store precise GPS coordinates or location history
- Location permission is used exclusively for Bluetooth Low Energy (BLE) device discovery

---

## 6) LUNO Toy Hardware & Backend Communication

### 6.1 How LUNO Toys communicate with our backend

After initial WiFi setup, your LUNO Toy connects directly to LUNO's backend services over the internet to provide interactive features.

**What the toy sends to our backend:**
- Your email address (in HTTP request headers for authentication)
- Child's messages and prompts during conversations
- Conversation session data (start time, end time, duration)
- Device status updates (battery level, connection status)

**Why this is necessary:**
- To generate AI-powered responses to your child's conversations
- To store conversation history for parental review
- To monitor for safety concerns and flag inappropriate content
- To maintain device status and settings synchronization

**Security measures:**
- All communication between the toy and backend uses HTTPS/TLS encryption
- Your email address authenticates the toy's requests to ensure data is associated with your account
- Backend enforces access controls so users can only access their own data

### 6.2 Data stored on the LUNO Toy device

Your LUNO Toy stores limited data locally on the device:
- WiFi network name (SSID) and password
- Your email address (for backend authentication)
- Device configuration settings (volume, LED brightness, etc.)

This data remains on the toy and is not transmitted to third parties for advertising or marketing purposes.

## 7) AI & Third-Party Processing

LUNO may rely on trusted third-party providers to deliver certain features (for example, AI response generation or hosting services).

### 7.1 What may be shared for AI processing

If AI features are enabled, LUNO may send the following to an AI provider to generate responses:

- The child's prompt/message during conversations
- Limited context necessary for response quality and continuity (previous messages in the conversation)
- Metadata required for routing the request (non-advertising, non-tracking)
- Child's age level and content preferences (for age-appropriate responses)

### 7.2 How we restrict third parties

We use third-party providers in a way intended to:

- Limit processing to what is necessary for the feature
- Protect data during transmission (HTTPS/TLS encryption)
- Prevent usage for advertising or sale of data
- Comply with children's privacy protection requirements

### 7.3 No sale of data

We do **not** sell personal data, conversation content, or children's information to third parties.

---

## 8) Data Sharing (When We Share and Why)

We share data only as needed to operate the service or comply with legal obligations.

### 8.1 Service providers (processors)

We may share limited data with vendors who help us operate LUNO, such as:

- Cloud hosting and databases (e.g., Firebase/Firestore)
- Security and monitoring providers
- AI response generation providers (if applicable)
- Customer support tools (if applicable)

These providers are permitted to process data only as needed to provide the service and are expected to follow confidentiality and security requirements.

### 8.2 Legal and safety disclosures

We may disclose data if required to:

- Comply with law, regulation, or legal process
- Protect the safety and rights of users or the public
- Investigate abuse, fraud, or security incidents
- Respond to child safety concerns

### 8.3 Business transfers

If LUNO is involved in a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction, subject to applicable privacy protections.

---

## 9) Data Retention

We retain data only as long as reasonably necessary to provide the service and for legitimate purposes such as security, compliance, and troubleshooting.

### 9.1 Typical retention logic

- **Account data**: retained while your account remains active.
- **Conversation history**: retained while enabled and until you delete it in-app, unless required for security/compliance.
- **Diagnostics logs**: retained for a limited period to debug and maintain stability.
- **Support communications**: retained as long as needed to resolve requests and maintain records.

Retention periods may vary depending on system requirements and legal obligations.

---

## 10) In-App Data Deletion & User Controls

LUNO provides **in-app controls** so you can delete your data without emailing support.

### 10.1 Delete conversations and stored app data (in-app)

You can delete stored data directly in the App, including:

- Conversation history and messages associated with your account (where applicable)
- Child profiles you created (where applicable)
- Toy associations saved to your account (where applicable)

**How to delete in the App:**  
Open the App → **Settings** → **Privacy & Data** (or **Account**) → **Delete Data** / **Delete Conversations** / **Delete Account** (depending on your options).

### 10.2 Delete your account (in-app)

If available, you can delete your account from within the App. Account deletion typically removes or de-identifies personal information associated with your account, subject to the retention notes below.

**What happens when you delete your account:**
- All child profiles and associated data are deleted
- All conversation history and messages are deleted
- All toy associations are removed
- Your user preferences and settings are deleted
- Aggregate statistics are removed

### 10.3 Deletion timing and backups

When you delete data in-app:

- We process deletion as quickly as reasonably possible.
- Some residual copies may persist temporarily in encrypted backups or security logs and will be removed or overwritten according to our retention practices.
- Data stored on the LUNO Toy device (WiFi credentials, email) must be manually reset by factory resetting the toy

### 10.4 If you need help

If you experience issues deleting data in the App, contact:
**auracampusapp@gmail.com**

---

## 11) Children's Privacy

LUNO is intended for family use and may be used by children under parental supervision.

**Our commitments:**
- We do not knowingly collect personal data from children without parental/guardian involvement
- We do not sell children's data or personal information
- We do not use children's data for behavioral advertising
- Parents/guardians have full control over child profiles and conversation recording
- Parents can delete all child data at any time through the App

**Parental responsibilities:**
- Parents/guardians are responsible for creating and managing child profiles
- Parents should supervise their children's use of LUNO Toys
- Parents should review parental control settings and conversation recordings regularly
- Parents should avoid entering sensitive information in child profiles

**Safety features:**
- Automated content filtering based on age level
- Flagged conversation detection for parental review
- Customizable blocked topics and alert settings
- Conversation recording can be disabled at any time

If you believe a child's data has been collected improperly, contact us at **auracampusapp@gmail.com** and we will take appropriate steps.

---

## 12) Your Rights & Choices

Depending on your location, you may have rights to:

- Access the personal data we hold about you
- Request correction or deletion
- Restrict or object to certain processing where applicable

You can exercise many of these choices directly inside the App (Section 10). If you need additional help, email **auracampusapp@gmail.com**.

---

## 13) "Tracking" and Advertising

LUNO does not use your personal data for behavioral advertising across third-party apps or websites.

**What we do NOT do:**
- We do not sell personal data or children's information
- We do not use your data for cross-site tracking
- We do not share data with advertising networks
- We do not use location data for advertising purposes
- We do not create advertising profiles based on your child's conversations

---

## 14) International Transfers

If you use LUNO from outside the United States, your information may be processed and stored in regions where our service providers operate. We take reasonable steps designed to protect your information consistent with this Policy.

---

## 15) Changes to This Policy

We may update this policy from time to time. When we do:

- We will update the **"Last updated"** date at the top
- Continued use of the App after updates indicates acceptance of the revised policy
- For material changes affecting children's privacy, we may provide additional notice to parents

---

## 16) Contact Us

If you have questions about privacy or data practices, contact:

**LUNO**  
Email: **auracampusapp@gmail.com**
