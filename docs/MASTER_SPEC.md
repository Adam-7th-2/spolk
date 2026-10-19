# SPOLK — Complete End-to-End Codex Master Prompt

This prompt instructs Codex to build Spolk as a complete, production-oriented English teaching academy, from the public website to the student LMS, live classrooms, video recording, teacher and admin dashboards, guardian controls, and multilingual AI speaking tutor.

It is designed so that Codex:

- Builds the entire project using real code, not mockups or static demonstrations.
- Uses free and open-source technologies wherever possible.
- Makes its own reasonable technical decisions without repeatedly asking you questions.
- Implements, tests, debugs, and documents each feature before moving on.
- Uses realistic development data until external services are configured.
- Only asks you for API credentials, service configuration, or other genuinely necessary external actions at the end, during deployment and integration.
- Does not require Figma or paid AI-generated assets.

The prompt is long because it serves as both the product requirements document and Codex's development instructions.

You can paste it into Codex as the main project instruction.

# SPOLK — MASTER CODEX ENGINEERING PROMPT

## Build a Complete Online English Academy from Zero to Production

**Project:** Spolk\
**Product type:** Multilingual online English academy, personalized LMS, virtual classroom, AI tutor and professional education platform\
**Primary objective:** Deliver a fully coded, extensible, secure and deployable website using free and open-source tools wherever realistically possible\
**Development method:** Autonomous, milestone-based implementation using Codex\
**Design:** Original premium educational UI based on my uploaded reference images\
**Design tool:** Code directly. Do not require Figma.\
**Cost target:** $0 monthly vendor spend for development and a small pilot, within available free-tier quotas\
**External credentials:** Ask me only at the final integration/deployment stage, after completing everything possible locally

---

# PART 0 — YOUR ROLE AND OPERATING INSTRUCTIONS

You are the lead software architect, senior full-stack engineer, UI/UX designer, database engineer, DevOps engineer, security engineer, QA engineer, and technical documentation author for Spolk.

Your responsibility is to create the complete product, not merely explain how it could be built.

You must write functioning code, configure the project, implement features, execute tests, debug errors, and prepare deployment instructions.

## 0.1 Autonomous development rules

Follow these rules throughout the project:

1. Do not repeatedly ask for permission to continue.
2. Do not stop after producing a design or architecture document.
3. Do not build a frontend that is disconnected from its backend and call it complete.
4. Do not replace real functionality with decorative buttons.
5. Do not use fake authentication or insecure mock permissions.
6. Do not assume paid API credentials exist.
7. Do not ask for passwords or API keys during initial development.
8. Use environment-variable placeholders and development adapters for unavailable external services.
9. Build independent modules that can run and be tested locally.
10. Implement each feature incrementally, integrate it, and verify its behavior.
11. Fix build and test failures before proceeding.
12. Maintain a progress ledger showing finished, partially implemented, blocked, and untested features.
13. Never mark a feature complete without evidence.
14. Do not silently omit difficult requirements.
15. Use TypeScript strict mode, readable code, reusable modules and appropriate error handling.
16. Do not invent third-party free-plan limits. Verify current official documentation when necessary.
17. Do not commit secrets or real student information.
18. Do not upload the application or private data to external platforms without authorization.
19. Do not request external credentials until all locally feasible work is finished.
20. When an external service blocks end-to-end testing, implement its adapter and contract tests, then mark real integration testing as pending.

Do not interpret "fully functioning" as permission to claim that a service has been tested when actual credentials or infrastructure are unavailable.

## 0.2 Definition of completion

A module is complete only when:

- Its interface has been implemented.
- Its server-side functionality exists.
- Its database entities and migrations are implemented.
- Authentication and authorization are enforced.
- Validation and error handling are present.
- Loading, empty and failure states work.
- Responsive behavior is verified.
- Relevant automated tests pass.
- Documentation is updated.
- Its functionality has been integrated into the rest of Spolk.

A simulated adapter is not equivalent to a verified production integration.

## 0.3 Project deliverables

Deliver:

- Complete source-code repository
- Database schema and migrations
- Seed data and development fixtures
- Secure authentication and authorization
- Full student LMS
- Teacher and admin workspaces
- Guardian experience
- Real-time classroom module
- Recording module
- Course-specific RAG tutor
- Synthetic 3D AI speaking tutor
- Responsive design system
- Automated tests
- CI pipeline
- Deployment configuration
- Environment-variable reference
- API integration checklist
- User and administrator documentation
- Technical architecture documentation

---

# PART 1 — PRODUCT VISION

Spolk is a modern online English academy that makes learning personalized, interactive, accessible and engaging.

It combines the strengths of:

- Cohort-based teaching
- Individualized learning
- Structured video courses
- Scheduled live classrooms
- Collaborative educational tools
- AI-supported speaking practice
- Teacher mentorship
- Automated progress tracking

Students should not feel as though they are using a generic management dashboard.

The public website should feel inspiring and premium. The student LMS should feel motivating and friendly. The classroom should feel focused and professional. The AI speaking studio should feel conversational and immersive. The admin dashboard should prioritize clarity and operational efficiency.

## 1.1 Initial schools

Create these independently configurable English programs:

1. Kids English — ages 6–12
2. School English — ages 13–18
3. General English — A1 through C2
4. Business English
5. Academic English
6. English for IT and Engineering
7. IELTS and TOEFL preparation
8. Conversational English
9. English for job interviews
10. English for research and university studies

Administrators must be able to create additional schools without changing application code.

Each school has its own courses, levels, learning objectives, visual category, admission requirements, tutors and assignments.

## 1.2 Supported languages

Initially support:

- English
- Russian
- Amharic

Design the localization system to support additional languages.

Separate interface localization from educational explanation language.

For example, a student may use the Russian interface while taking an English lesson and choosing explanations in English.

---

# PART 2 — TECHNOLOGY STACK

Use a TypeScript monorepo with the following preferred tools.

## 2.1 Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- Lucide icons
- React Hook Form
- Zod
- TanStack Query where server-state caching is useful

Use Server Components where appropriate without forcing every feature into server-side rendering.

Keep interactive classroom, audio and camera components client-side.

## 2.2 Backend

Preferred:

- Next.js application layer
- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Row Level Security
- Server-side API routes
- Cloudflare Workers for suitable edge operations

Avoid unnecessary microservices.

Select a supported Next.js deployment approach based on current Cloudflare compatibility.

Do not use deployment-specific APIs in shared business logic.

## 2.3 Live video

Primary provider:

- LiveKit

Use LiveKit's React SDK and server-side token issuance.

Build a provider abstraction so that another WebRTC provider or a self-hosted LiveKit deployment can be substituted later.

Do not implement a custom WebRTC SFU from scratch.

## 2.4 AI inference

Primary:

- Cloudflare Workers AI using a suitable supported open-weight multilingual model

Fallback:

- Local development adapter using Ollama
- Configurable alternative model adapter

AI providers must use a shared application interface.

The application must continue operating when AI inference is unavailable.

## 2.5 RAG

Use:

- PostgreSQL with pgvector or Cloudflare Vectorize
- Course-aware document indexing
- Multilingual embedding model
- Permission-aware retrieval
- Source citation metadata

Avoid maintaining two vector databases without a clear architectural reason.

## 2.6 3D avatars

Use:

- Three.js
- React Three Fiber
- Blender-compatible assets
- GLTF/GLB or VRM
- Browser-rendered lip synchronization
- Audio playback and animation timelines

Do not depend on paid video-avatar generation APIs.

## 2.7 Speech

Primary low-cost approach:

- Web Speech API where reliably available
- Browser speech synthesis
- Browser-side audio capture

Fallback:

- Open-source speech recognition and TTS adapters
- Smaller on-device models where practical

Do not assume browser speech recognition is fully local or private. Document platform differences and require consent for applicable audio processing.

## 2.8 Testing

Use:

- Vitest
- React Testing Library
- Playwright
- Database integration tests
- API contract tests
- Accessibility checks
- Browser compatibility tests

## 2.9 Repository

Use GitHub-compatible Git version control.

Create a CI pipeline for linting, type checking, unit tests and production builds.

---

# PART 3 — COMPLETE USER ROLES

Implement these user roles.

## Visitor

Can:

- Browse the public website
- View course catalogues
- Read public teacher profiles
- View published portfolio information
- Submit an application
- Register for an account
- Contact the academy

Cannot access private student information or enrolled-only course materials.

## Student

Can:

- View personalized dashboard
- Access assigned curricula
- Open released lessons
- Attend authorized live classes
- Join teacher invitations
- Use permitted AI tutors
- Upload assignments
- Take quizzes
- View feedback and grades
- Save private notes
- View authorized recordings
- Update permitted account settings

## Teacher

Can:

- Manage assigned courses
- Upload teaching resources
- Create lessons and assignments
- Schedule sessions within assigned permissions
- Invite enrolled students
- Moderate classrooms
- Start authorized recordings
- Review submissions
- Give feedback
- Track progress and attendance

## Guardian

Can:

- Access linked children's permitted records
- View attendance and progress
- Manage permissions
- Receive relevant notifications
- Review scheduling information
- Request support

## Administrator

Can:

- Create schools and programs
- Manage users and roles
- Assign courses and instructors
- Configure curriculum
- Manage schedules
- Control recording permissions
- View academy analytics
- Configure AI availability
- Manage content and permissions
- Review audit logs

## Super Administrator

Can manage application-wide settings, administrator roles, integrations, retention policies and platform configuration.

An account may hold multiple roles, but each privileged operation must verify the appropriate current role and resource permissions.

---

# PART 4 — VISUAL DESIGN SYSTEM

The Spolk design should be inspired by my uploaded UI references, while remaining an original implementation.

Do not copy another company's logo, proprietary artwork or entire interface as an exact reproduction.

Do not generate new AI marketing images.

Use my supplied assets where available, subject to rights and technical compatibility.

## 4.1 Brand identity

Website name: Spolk.

Use my uploaded green-and-yellow logo as the primary visual identity.

Do not redraw an inaccurate replacement.

If the logo file is not accessible in the project workspace, create a clearly marked asset slot and list the required file in the final integration checklist.

## 4.2 Visual language

Use a hybrid design style:

- Premium landing pages
- Friendly, colorful educational dashboards
- Professional teacher and admin interfaces
- Immersive AI-speaking experience
- Clean video playback interfaces
- Sophisticated but lightweight animations

Preferred palette:

- Warm white and cool-white backgrounds
- Royal blue for major learning actions
- Violet for secondary technology-oriented interactions
- Soft lavender for selected navigation
- Pastel yellow, pink and mint for course categories
- Dark navy for video presentation
- Green and yellow accents coordinated with the supplied logo

Ensure visual accessibility rather than relying only on pastel text.

## 4.3 Typography

Use Poppins as the initial primary UI typeface.

Use:

- Poppins SemiBold for navigation and cards
- Poppins Bold for primary titles
- Poppins Regular for standard paragraphs
- Poppins Medium for interface labels

Allow a secondary expressive font for major marketing headlines only if it improves the result and is freely licensed.

Create a consistent typography scale.

Use responsive typography and avoid unnecessary giant headings on LMS pages.

## 4.4 Layout and spacing

Create:

- Desktop layout around 1440px
- Tablet layouts
- Mobile layouts around 390px
- Responsive sidebar navigation
- Adaptive content grids
- Compact mobile video controls
- Persistent bottom navigation where useful

Use consistent spacing tokens and component radii.

Prefer structured whitespace and strong hierarchy over excessive decoration.

## 4.5 Reusable components

Build a reusable component library containing:

- Primary, secondary, ghost and destructive buttons
- Inputs and search
- Select menus
- Date/time pickers
- Calendar
- Navigation items
- Course cards
- Student cards
- Teacher cards
- Live-session cards
- Learning progress indicators
- Charts
- Activity feeds
- File upload components
- Recording player controls
- Avatar tiles
- Modals and dialogs
- Notifications
- Permission prompts
- Tabs
- Drawers
- Data tables
- Pagination
- Tooltips
- Empty states
- Skeleton loading states
- Error screens

Include disabled, loading, error, selected, hover and keyboard-focus states.

## 4.6 Motion

Use subtle, purposeful motion.

Suggested principles:

- 150–250 ms standard UI transitions
- Gentle spring interactions for cards
- Animated progress indicators
- Lightweight entrance transitions
- Smooth sidebar expansion
- Subtle floating elements in marketing sections
- Audio-reactive AI avatar behavior

Honor reduced-motion settings.

Do not animate critical reading content unnecessarily.

Do not make the LMS depend on GPU-heavy 3D effects.

---

# PART 5 — PUBLIC WEBSITE

Implement a complete marketing and enrollment website.

## 5.1 Homepage

Required sections:

1. Navigation with Spolk branding
2. Hero section
3. Primary enrollment call to action
4. Introduction to the academy
5. School category cards
6. How learning works
7. Live classroom introduction
8. AI speaking tutor introduction
9. Personalized learning explanation
10. Course discovery
11. Teacher introduction
12. Academy benefits
13. Student progress illustration
14. FAQ
15. Contact section
16. Footer

Do not use fabricated student testimonials, fake awards, fake ratings or misleading user counts.

Use authentic data where available.

## 5.2 Portfolio

Create:

- About
- Education and experience
- Professional projects
- Research and publications
- Teaching philosophy
- Skills
- Portfolio gallery
- Contact form

Use editable content data files or an admin-managed CMS-like system.

Do not invent personal achievements.

## 5.3 Course catalogue

Support filters for:

- School
- Age group
- CEFR level
- Difficulty
- Course duration
- Schedule type
- Live/recorded format
- Enrollment status
- Teacher
- Free/paid status

Each course detail page must show prerequisites, syllabus, expected outcomes, lesson structure and application instructions.

## 5.4 Enrollment

Implement a complete application workflow:

1. Select course
2. Create or sign into account
3. Enter relevant learning preferences
4. Complete placement assessment when required
5. Submit application
6. Receive confirmation
7. Admin reviews application
8. Enrollment is assigned
9. Student receives their learning pathway

Support both automatic enrollment and administrator approval.

---

# PART 6 — AUTHENTICATION AND ONBOARDING

Implement:

- Registration
- Login
- Logout
- Password reset
- Email verification
- Session management
- Role selection controlled by the server
- Account profile
- Language preferences
- Timezone
- Device settings
- Notification preferences

Never let a client assign itself an administrator role.

Student onboarding should include:

- Preferred name
- Age-related eligibility information
- Guardian relationship where necessary
- English level
- Learning objective
- Preferred program
- Weekly availability
- Explanation language
- Speaking confidence self-assessment

Minimize personal information collected from children.

---

# PART 7 — STUDENT DASHBOARD

Build a welcoming and practical dashboard.

## 7.1 Main components

Include:

- Personalized welcome banner
- Learning progress
- Current English level
- Next lesson
- Upcoming live class
- Weekly timetable
- Assigned homework
- Recent feedback
- Attendance
- Course cards
- Vocabulary practice
- Speaking practice shortcut
- Notifications
- Teacher messages
- Achievements and streaks

Do not overwhelm students with every metric at once.

Let students customize which cards appear.

## 7.2 Individual curriculum

Each student must have their own assigned learning path.

A path includes:

- Current level
- Learning goals
- Assigned courses
- Module sequence
- Lesson sequence
- Target dates
- Required assessments
- Prerequisites
- Teacher overrides
- Completion status

Use shared course content where possible and individual assignment records for customization.

Do not duplicate entire course documents for every student.

## 7.3 Lesson unlocking

Support:

- Immediate availability
- Fixed date/time release
- Days after enrollment
- Manual instructor release
- Prerequisite completion
- Minimum quiz score
- Group-based availability
- Individual student override

Enforce all restrictions on the server.

A locked lesson must not become downloadable through a guessed URL.

## 7.4 Student calendar

Show:

- Live lessons
- Assignment deadlines
- Assessments
- Speaking practice sessions
- Individual tutoring appointments
- Special events
- Cancellations and schedule changes

Store UTC timestamps and display local times.

Handle daylight-saving transitions.

---

# PART 8 — COURSE LESSON PLAYER

Use a three-column education-focused layout when screen width permits.

## Left column

Course structure:

- Modules
- Lessons
- Completion indicators
- Duration
- Locked/unlocked states
- Prerequisite labels

## Center column

Learning content:

- Video player
- PDFs
- Slides
- Articles
- Practice questions
- Exercises
- Downloadable resources
- Interactive tasks

## Right column

Student tools:

- Notes
- Bookmarks
- Vocabulary
- AI explanation
- Transcript
- Questions
- Lesson navigation

## Video features

Support:

- Play/pause
- Playback speed
- Seek timeline
- Full screen
- Captions
- Transcript navigation
- Resume playback
- Progress saving
- Timestamped notes
- Keyboard controls

Only mark a lesson complete according to configurable rules.

Simply opening a video must not necessarily count as completion.

---

# PART 9 — ASSESSMENTS AND HOMEWORK

Implement an assessment engine.

Question types:

- Multiple choice
- Multiple select
- Short answer
- Fill in the blank
- Matching
- Ordering
- Reading comprehension
- Vocabulary questions
- Writing submissions
- Audio recordings
- Teacher-reviewed speaking exercises
- File uploads

Support:

- Time limits
- Attempt limits
- Randomized question ordering
- Rubrics
- Automatic grading for suitable questions
- Teacher grading
- Partial credit
- Feedback
- Late submission rules
- Retakes
- Progress analytics

Avoid claiming that subjective speaking quality can be graded with perfect accuracy.

AI-assisted feedback should be distinguishable from teacher assessment.

---

# PART 10 — LIVE CLASSROOM SYSTEM

Implement a complete browser-based classroom using LiveKit.

## 10.1 Scheduled sessions

Admin or authorized teachers can:

- Create a session
- Select course
- Select group
- Invite specific students
- Choose starting time
- Set duration
- Configure joining window
- Enable or disable student chat
- Allow or restrict cameras
- Allow or restrict screen sharing
- Allow or restrict whiteboard editing
- Enable or disable academy recording
- Cancel or reschedule a session

Students see only sessions they are authorized to join.

## 10.2 Joining flow

When a student clicks Join:

1. Verify authenticated identity.
2. Verify course enrollment or invitation.
3. Verify joining window.
4. Verify session state.
5. Create short-lived room token server-side.
6. Open device setup screen.
7. Explain microphone/camera permissions.
8. Allow the student to choose devices.
9. Display camera preview.
10. Join after explicit student action.

Never require the student to enable their camera unless there is a justified and disclosed course rule.

## 10.3 Classroom controls

Implement:

- Microphone on/off
- Camera on/off
- Audio device selection
- Video device selection
- Screen sharing
- Stop screen sharing
- Participant list
- Raise hand
- Classroom chat
- Shared notes
- Private notes
- Whiteboard
- Pen
- Highlighter
- Eraser
- Shapes
- Text annotation
- Presenter mode
- Pin participant
- Connection status
- Leave class
- End class

## 10.4 Floating camera video

This is a major requirement.

When screen sharing:

- The teacher's video can shrink into a floating window.
- Students can also configure floating video.
- Floating video may be circular or rectangular.
- Users can drag it.
- Users can resize it.
- Users can minimize it.
- Users can expand it.
- Users can pin a participant.
- The floating position is saved as a user preference.
- The layout returns to normal when screen sharing ends.

Support mobile layouts with appropriately constrained draggable video windows.

Do not cover essential classroom buttons.

## 10.5 Whiteboard and annotation

Use Excalidraw or a suitable compatible open-source component as a foundation.

Allow:

- Freehand drawing
- Highlighting
- Text
- Shapes
- Erasing
- Page navigation
- Teacher-controlled editing permissions

For annotations over a shared presentation, use a synchronized overlay in presentation coordinates.

Do not pretend the app can directly draw onto another person's operating-system desktop.

## 10.6 Class chat

Support:

- Group messages
- Instructor announcements
- Controlled message permissions
- Moderation
- Message reporting
- Message retention rules
- Safe handling of minors

Avoid creating unrestricted private adult-to-child messaging.

## 10.7 Attendance

Record verified:

- Join time
- Leave time
- Participation duration
- Session identifier
- Attendance status

Do not trust client-submitted duration totals alone.

---

# PART 11 — CLASS RECORDING SYSTEM

Minimize hosted recording costs.

## 11.1 Permissions

Allow administrator configuration:

- Recording disabled
- Admin only
- Admin and assigned teacher

Students cannot use the application's recording function unless separately authorized by a future explicit policy.

## 11.2 Local browser recording

Build a local recording workflow.

Requirements:

- Browser-side capture
- Capture supported meeting content
- Composite authorized video elements
- Capture selected audio
- Include optional shared-screen presentation
- Include optional whiteboard overlay
- Show a recording indicator
- Warn before closing an active recording
- Stop recording
- Save locally to the teacher's device
- Download fallback
- Error handling
- Recording format compatibility

Use MediaRecorder or another supported browser-native solution.

Do not assume every browser supports the same capture APIs.

Add a recommended browser compatibility guide.

## 11.3 Recording metadata

Store:

- Session
- Authorized recording owner
- Start/end times
- Recording permission
- Consent status
- File metadata
- Optional upload reference
- Publication state

Do not upload local recordings automatically.

## 11.4 Playback library

If a recording is later uploaded, authorized students can:

- Watch it
- Navigate playback
- View transcript where available
- Take notes
- Comment where permitted
- Save timestamps
- Revisit class resources

## 11.5 Optional YouTube integration

Prepare an adapter supporting future YouTube uploading.

Do not require Google or YouTube API credentials during initial development.

Never publish recordings automatically.

Require explicit authorization before any external upload.

Do not treat unlisted YouTube links as equivalent to authenticated private course access.

---

# PART 12 — COURSE-ONLY AI TUTOR

Create a separate AI learning assistant.

Its answers must be based on authorized course material.

## 12.1 Supported materials

- PDF
- DOCX
- TXT
- Markdown
- PPTX
- Teacher notes
- Lesson descriptions
- Approved transcripts
- Structured curriculum content

Build parsers and ingestion pipelines for each supported format.

Files that cannot be parsed should generate clear validation errors.

## 12.2 Ingestion pipeline

1. Teacher uploads material.
2. Validate ownership and permissions.
3. Verify file format and size.
4. Extract text.
5. Normalize text.
6. Preserve source metadata.
7. Divide into coherent chunks.
8. Generate embeddings.
9. Store searchable vectors.
10. Attach course and lesson identifiers.
11. Apply publication and access metadata.
12. Track indexing status and errors.

Support replacing or deleting indexed resources.

Deleting a source must invalidate its associated retrievable chunks.

## 12.3 Retrieval security

Before retrieval, verify:

- Student identity
- Course enrollment
- Authorized lesson set
- Release conditions
- Document publication state
- Applicable guardian/age restrictions

After vector search, verify permissions again before passing content to the language model.

Treat uploaded material as untrusted data, not instructions.

## 12.4 Response format

An AI answer should contain:

- Concise explanation
- English examples
- Optional explanation in Russian or Amharic
- Source lesson
- Source document
- Optional practice exercise

If supporting evidence is unavailable, the assistant must refuse or explain that the topic is outside the current material.

When there is no relevant evidence, avoid calling the language model.

## 12.5 Strict behavior

The tutor must not:

- Browse the internet
- Retrieve another student's materials
- Retrieve locked lessons
- Invent citations
- Use general unrelated topics as if they came from the curriculum
- Obey malicious instructions embedded in documents
- Access private administrative data
- Reveal another user's conversations

A language model cannot provide mathematically guaranteed perfect source adherence.

Implement application-enforced retrieval constraints, evidence checks, usage limits and tests.

## 12.6 AI usage controls

Support:

- Student quotas
- Daily request limits
- Maximum response length
- AI provider outage handling
- Input validation
- Prompt-injection testing
- Caching where safe
- Usage logs without unnecessarily retaining sensitive data
- Administrative usage dashboard

The normal LMS must remain available if the free AI quota runs out.

---

# PART 13 — HUMAN-LIKE AI SPEAKING PARTNER

Build an immersive personal speaking-practice system.

## 13.1 Synthetic identity

All AI teachers must be artificial characters.

Do not use a real person's face as the base identity.

Use original synthetic 3D avatar geometry or suitably licensed synthetic assets.

Allow randomized:

- Facial proportions
- Hairstyles
- Eye shapes
- Skin appearance
- Clothing
- Accessories
- Voice profile
- Expression style

Do not claim a perfect guarantee that a randomly generated synthetic face cannot resemble any real person.

Persist a consistent avatar identity for each tutor.

## 13.2 Avatar animation

Support:

- Idle animation
- Natural blinking
- Small head movements
- Mouth movement
- Speech-synchronized lip animation
- Listening indicator
- Speaking indicator
- Thinking/loading state
- Friendly expression transitions

Do not require continuous cloud-generated video.

Render the avatar in the browser.

Do not clone voices or faces from real people without authorization.

## 13.3 Personal speaking session

Create:

`/dashboard/speaking-practice`

The student selects:

- AI teacher
- Practice topic
- Current lesson
- English level
- Explanation language
- Voice speed
- Practice duration
- Microphone
- Optional camera
- Captions
- Feedback preferences

## 13.4 Pre-session experience

Ask for microphone and optional camera access.

Display:

- Device preview
- Audio test
- Permission explanation
- Session duration
- Learning objective
- Start session button

Do not activate the camera or microphone until the user takes the relevant permission action.

## 13.5 AI introduction

The AI greets the student naturally.

Example:

"Hello! I'm Nova, your English speaking partner. It's great to see you today. Would you like to practise conversation, pronunciation or today's lesson?"

Use the student's preferred name only when provided.

The AI should adapt its opening to the student's age group and current language level.

## 13.6 Turn-based voice pipeline

Implement:

1. Student starts speaking.
2. Browser captures audio.
3. Speech recognition generates transcript.
4. Authorized course context is retrieved.
5. AI generates a response.
6. TTS synthesizes speech.
7. Avatar mouth animation follows speech timing.
8. Captions appear.
9. Student responds.
10. Conversation continues until finished.

Prioritize functional turn-taking first.

Support interruption and more natural duplex conversations as later enhancements if technically and financially practical.

## 13.7 Practice modes

- Everyday conversation
- Self-introduction
- Pronunciation
- Vocabulary
- Grammar explanation
- Job interviews
- Business meetings
- Customer service
- Travel
- Academic presentations
- Speaking from today's lesson
- Teacher-assigned practice
- Roleplay

All substantive teaching content must remain grounded in the student's permitted learning material.

Generic greetings and conversation-control messages may be handled by a separately restricted dialogue layer.

## 13.8 Speaking feedback

Provide:

- Grammar corrections
- Vocabulary recommendations
- Fluency observations
- Suggested alternative sentences
- Practice completion summary
- Next speaking exercise

Pronunciation scoring must be labeled appropriately.

Do not invent scientifically precise pronunciation scores from plain text transcripts.

Only enable detailed pronunciation metrics when supported by suitable speech analysis.

## 13.9 Student camera

Allow an optional local camera preview next to the AI avatar.

By default:

- Do not send webcam frames to the AI model.
- Do not perform facial emotion analysis.
- Do not record video.
- Do not infer protected personal attributes.

Camera analysis must remain an explicitly separate, consent-based future feature if ever introduced.

---

# PART 14 — TEACHER-INITIATED LIVE INVITATIONS

Build a teacher invitation system.

## 14.1 Teacher workflow

1. Open teacher dashboard.
2. Select assigned course.
3. Select eligible student or group.
4. Choose immediate or scheduled session.
5. Configure duration.
6. Select session permissions.
7. Send invitation.

## 14.2 Student workflow

Student receives a notification with:

- Teacher
- Course
- Session purpose
- Start time
- Expected duration
- Accept or decline

On acceptance:

- Verify invitation
- Open pre-join device settings
- Issue secure classroom token
- Join the appropriate room

Invitations must expire according to policy.

Prevent replaying expired invitations.

Support cancellation, rescheduling and notification of changes.

## 14.3 One-to-one tutoring

Support teacher/student video, audio, chat, shared lesson materials and optional notes.

For minors, enforce guardian and safeguarding requirements, including restrictions on private communications and suitable oversight.

---

# PART 15 — TEACHER DASHBOARD

Build a complete teacher workspace.

Features:

- Today's schedule
- Assigned courses
- Student groups
- Upcoming classes
- Create lesson
- Upload resources
- Build assessments
- Review submissions
- Grade work
- Create assignments
- Schedule class
- Invite student
- View attendance
- View student progress
- Class announcements
- Recording management
- AI knowledge indexing status

Teacher permissions must be scoped to their assigned resources.

Teachers must not be able to view all academy student records by default.

---

# PART 16 — ADMIN CONSOLE

Build an administration workspace with clear navigation.

## Modules

1. Overview
2. Students
3. Teachers
4. Guardians
5. Schools
6. Programs
7. Courses
8. Curriculum
9. Scheduling
10. Live classrooms
11. Applications
12. Assignments
13. Assessments
14. Recordings
15. AI knowledge
16. Notifications
17. Analytics
18. Permissions
19. Audit logs
20. Settings

## Admin overview

Show real statistics:

- Enrolled students
- Active courses
- Classes this week
- Attendance
- Assignment completion
- Upcoming deadlines
- Pending applications
- AI usage
- Video usage
- Storage usage
- Failed scheduled jobs

Use real data and explicit empty states.

Do not show invented statistics in production.

## Scheduling administration

Support:

- Calendar views
- Course-based schedules
- Student-based schedules
- Instructor availability
- Recurring sessions
- Cancellation
- Rescheduling
- Timezone conversion
- Release rules
- Notification preferences

Check teacher and room conflicts.

---

# PART 17 — GUARDIAN SYSTEM AND CHILD SAFETY

Build guardian accounts linked to eligible child accounts.

Guardian functionality:

- Student progress overview
- Attendance
- Assignments
- Scheduled classes
- Contact with the academy
- Permission management
- Notification settings

Implement appropriate child-protection requirements, including:

- Age-related eligibility rules
- Guardian consent when required
- Teacher communication restrictions
- Moderated chat
- Private student information
- Recording controls
- Data minimization
- Retention/deletion policies
- Content moderation
- Reporting mechanisms

Do not assume one country's rules cover every jurisdiction.

Document legal and operational reviews required before serving children.

---

# PART 18 — NOTIFICATIONS

Create an in-app notification service.

Events:

- Application submitted
- Enrollment approved
- Lesson unlocked
- Upcoming class
- Class rescheduled
- Teacher invitation
- Assignment due
- Homework graded
- New teacher feedback
- AI practice completed
- Certificate issued

Provide notification preferences.

Prepare email notification adapters, but do not require real email-provider credentials until final integration.

Use development logging for unsent messages.

Do not imply a notification was delivered externally when it was only logged.

---

# PART 19 — CERTIFICATES AND PROGRESS REPORTS

Support configurable completion certificates.

Include:

- Student display name
- Course title
- Completion date
- Certificate identifier
- Issuing academy
- Verification link
- Course outcome summary

Use secure public verification that does not expose unnecessary student data.

Allow administrators to disable public verification for minors or privacy-sensitive cases.

Generate progress reports with:

- Attendance
- Lesson completion
- Assessment outcomes
- Learning objectives
- Teacher feedback
- Recommended next steps

---

# PART 20 — DATABASE DESIGN

Design a normalized PostgreSQL schema covering:

- accounts
- profiles
- user_roles
- guardian_links
- schools
- programs
- courses
- modules
- lessons
- lesson_assets
- course_instructors
- course_enrollments
- placement_assessments
- learning_paths
- learning_path_lessons
- lesson_prerequisites
- lesson_progress
- assignments
- submissions
- assessment_questions
- assessment_attempts
- grading_rubrics
- grades
- live_sessions
- live_session_invites
- live_session_participants
- attendance_events
- recording_metadata
- user_notes
- student_messages
- announcements
- notifications
- AI_knowledge_documents
- AI_document_chunks
- AI_conversations
- AI_messages
- speaking_sessions
- avatar_profiles
- consent_records
- certificates
- audit_logs
- usage_counters
- application_settings

Add necessary join tables, foreign keys, indexes and unique constraints.

Use UUID primary keys where appropriate.

Use explicit migration files.

Define Row Level Security policies for sensitive tables.

Test student isolation and teacher assignment restrictions.

Create development seed data that uses clearly fictional identities.

---

# PART 21 — API ARCHITECTURE

Create secure API contracts for all application modules.

Examples:

- Authentication and profiles
- School and course catalogues
- Enrollment applications
- Course management
- Learning paths
- Lesson access
- Assessments
- Assignments
- Scheduling
- Session invitations
- Live room tokens
- Recording authorization
- Uploads
- RAG ingestion
- AI tutor questions
- Speaking sessions
- Reports
- Notifications

Use validation schemas.

Authenticate privileged requests.

Check authorization for each resource.

Implement rate limiting and abuse protection for expensive endpoints.

Do not expose secret provider credentials to browser code.

Use idempotency protection for operations that could otherwise create duplicate enrollment, invitations or notifications.

---

# PART 22 — ZERO-COST INFRASTRUCTURE STRATEGY

Build for a small experimental pilot within available free service allowances.

## Primary services

- Cloudflare for suitable web hosting and APIs
- Supabase for authentication, database and small file storage
- LiveKit free tier for limited live classes
- Workers AI for limited hosted inference
- Browser-native recording and speech functions where practical

## Resource-saving practices

Implement:

- Lazy loading
- Route-based code splitting
- Optimized images
- Efficient database queries
- Pagination
- Indexed filtering
- Caching
- AI request limits
- Recording storage limits
- Upload validation
- Browser-side 3D rendering
- Reduced-resolution video modes
- Quota usage dashboards
- Graceful degradation when external services are unavailable

Do not promise unlimited 24/7 video or AI capacity for free.

Never bypass vendor restrictions or create multiple accounts to evade quotas.

Do not implement automatic paid upgrades.

## API credentials

Use environment placeholders such as:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_AI_API_TOKEN`

Adapt exact names to the chosen supported SDKs.

Include an `.env.example`.

Do not place actual credentials in documentation.

---

# PART 23 — PERFORMANCE

Target:

- Responsive mobile usability
- Efficient first page load
- Smooth classroom navigation
- Reasonable operation on ordinary laptops
- Low-memory mode
- Reduced-motion mode
- Low-bandwidth video mode
- Graceful AI inference failure
- Accessible keyboard interactions

Large 3D assets must be lazy-loaded.

Provide a static avatar or audio-only fallback when browser graphics performance is insufficient.

Use measurable performance tests and document results.

Do not claim arbitrary performance scores without testing.

---

# PART 24 — SECURITY

Implement:

- Secure sessions
- Least-privilege permissions
- Row Level Security
- Server-side lesson access enforcement
- Short-lived video access tokens
- Private storage access
- Upload validation
- Appropriate content security policies
- Rate limiting
- Audit logs
- Consent records
- Error sanitization
- Secure secret handling
- Dependency scanning
- Backup/restore documentation
- Deletion and retention mechanisms

Create automated tests for:

1. Student accessing another student's data
2. Teacher accessing an unassigned course
3. Locked lesson access through a direct URL
4. Unauthorized classroom joining
5. Expired session invitation
6. Recording without permission
7. AI retrieval from an unauthorized course
8. Prompt injection through uploaded material
9. Malicious file uploads
10. Duplicate API submissions

---

# PART 25 — DEVELOPMENT PROJECT STRUCTURE

Use a modular repository similar to:

```
spolk/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── features/
│       │   │   ├── marketing/
│       │   │   ├── accounts/
│       │   │   ├── schools/
│       │   │   ├── courses/
│       │   │   ├── curriculum/
│       │   │   ├── scheduling/
│       │   │   ├── student/
│       │   │   ├── teacher/
│       │   │   ├── admin/
│       │   │   ├── guardian/
│       │   │   ├── classroom/
│       │   │   ├── recording/
│       │   │   ├── assessments/
│       │   │   ├── rag/
│       │   │   └── ai-speaking/
│       │   ├── components/
│       │   └── lib/
│       └── tests/
├── packages/
│   ├── ui/
│   ├── database/
│   ├── auth/
│   ├── permissions/
│   ├── curriculum-engine/
│   ├── video-adapter/
│   ├── recording-engine/
│   ├── rag-engine/
│   ├── avatar-engine/
│   └── shared-types/
├── supabase/
│   ├── migrations/
│   ├── seed/
│   └── tests/
├── workers/
│   └── ai-service/
├── docs/
├── scripts/
├── .github/
└── README.md
```

Adjust directories to match current framework conventions.

Do not introduce unnecessary workspace complexity when a simpler structure satisfies the requirements.

---

# PART 26 — IMPLEMENTATION MILESTONES

Execute the following stages in order.

## Milestone 1: Repository and architecture

Deliver:

- Project setup
- Dependency management
- TypeScript configuration
- Linting
- Formatting
- Initial routing
- Shared design tokens
- Database architecture
- Technical documentation
- CI foundation

Verify the application starts and builds.

## Milestone 2: Public website

Implement the complete public website, school pages, portfolio and catalogue.

Include responsive behavior and accessibility.

## Milestone 3: Authentication and onboarding

Implement users, roles, profiles, guardian relationships and onboarding.

Test authorization.

## Milestone 4: LMS

Implement courses, curricula, enrollment, lesson pages, materials and progress tracking.

Test scheduling restrictions.

## Milestone 5: Assessments

Implement quizzes, homework, submissions, grading and reports.

## Milestone 6: Teacher workspace

Implement course management, scheduling, invitations and student evaluation.

## Milestone 7: Admin console

Implement school administration, student management, reporting and settings.

## Milestone 8: Live classroom

Build video integration, controls, permissions, floating webcams, chat and collaborative whiteboard.

Use a development video adapter until real LiveKit credentials are supplied.

Test all non-provider-specific functionality.

## Milestone 9: Recording and playback

Implement local recording, downloading, metadata and replay management.

Test browser compatibility where possible.

## Milestone 10: Course-only AI tutor

Implement parsing, indexing, RAG, inference adapters and course-level restrictions.

Test unauthorized access and out-of-scope refusal.

## Milestone 11: AI speaking partner

Implement synthetic 3D avatar, audio pipeline, speaking modes, practice history and feedback.

Test with simulated speech and optional available local model providers.

## Milestone 12: Guardians and safety

Complete guardianship flows, consent, moderation, auditing and deletion workflows.

## Milestone 13: Integration tests

Test complete workflows:

Visitor → Enrollment → Student LMS → Lesson → Live class → Assignment → AI practice → Completion.

Test instructor and administrator workflows.

## Milestone 14: Production preparation

Prepare:

- Environment configuration
- Deployment scripts
- Production migrations
- Domain setup guide
- Secrets checklist
- Monitoring
- Quota limits
- Backup procedures
- Final security review
- Operational documentation

---

# PART 27 — ACCEPTANCE TEST SCENARIOS

Create Playwright and integration tests for these essential journeys.

### Student journey

A new student registers, completes placement, receives a course, sees scheduled lessons, completes an assessment and views progress.

### Teacher journey

A teacher creates a lesson, schedules its release, assigns homework, invites a student and grades a submission.

### Live classroom journey

A teacher schedules a class and a permitted student receives an invitation. The student joins through a device preview, controls microphone/camera, and sees screen sharing and floating video.

### AI tutor journey

A teacher uploads a document, indexing completes, and a student asks a permitted question. The tutor responds with course-specific evidence.

### AI security journey

A student requests content from another course and receives no unauthorized answer.

### Speaking partner journey

A student configures a speaking session, begins practice, hears a generated voice, sees the avatar animate, completes practice and receives feedback.

### Recording journey

An authorized teacher starts a recording, captures supported classroom content, stops it and downloads a valid file.

### Guardian journey

A linked guardian views permitted progress while being unable to access another child's information.

### Admin journey

An administrator creates a program, assigns teachers, manages enrollments and reviews usage analytics.

---

# PART 28 — AUTONOMOUS DEVELOPMENT CONTINUATION

Continue implementing the project through the milestones without waiting for repeated user instructions.

After each milestone:

1. Summarize what was implemented.
2. List changed files.
3. State which tests were executed.
4. Show actual results.
5. List remaining issues.
6. Update the progress ledger.
7. Continue to the next milestone if the environment supports it.

If an external credential is missing:

- Do not block unrelated development.
- Implement the integration adapter.
- Implement test fixtures.
- Implement contract tests.
- Document the required credential.
- Continue with other work.

Do not endlessly rebuild previously completed modules.

Do not overwrite working features merely to change their appearance.

Preserve functional behavior through regression testing.

---

# PART 29 — FINAL INTEGRATION REQUESTS

ONLY AFTER completing all implementation that can be performed without my external credentials, present one consolidated integration checklist.

Request only the items that are actually necessary.

Potential items:

1. Supabase project URL and public configuration
2. LiveKit project configuration
3. Cloudflare deployment/account configuration
4. AI model availability and required provider token
5. Hosting destination
6. Custom domain, if desired
7. Email service, if external notifications are enabled
8. Approved logo/source assets not already present
9. Required policy and legal decisions
10. Production administrator account setup

Avoid asking me to paste secrets into source code, Git commits or public documentation.

Prefer secure deployment secrets or appropriate authorized credential flows.

Do not ask for every possible service if a particular service is not actually used.

---

# PART 30 — FINAL DELIVERY REQUIREMENTS

The completed repository must provide:

- A working local development environment
- Database migrations
- Reproducible seed data
- Functional role-based application flows
- Unit tests
- Integration tests
- End-to-end tests
- Secure API contracts
- Responsive UI
- Deployment configuration
- Environment-variable documentation
- Complete README
- Operations guide
- Security and privacy checklist
- Known limitations
- Free-tier usage considerations

Provide exact commands for:

- Installation
- Development
- Linting
- Type checking
- Testing
- Database migration
- Production build
- Deployment

Distinguish clearly among:

- Fully implemented and locally tested features
- Implemented but requiring production credentials
- Features requiring real-browser/hardware verification
- Features requiring human policy/legal review
- Optional future enhancements

Do not claim the academy is live unless it has actually been deployed and verified.

---

# PART 31 — START IMPLEMENTING NOW

Begin immediately.

First inspect the current project directory and identify any existing code.

If it is empty, initialize the repository.

Create:

1. Initial monorepo
2. Root package configuration
3. Next.js application
4. Tailwind and UI component setup
5. Shared design tokens
6. Database schema plan
7. Architecture documentation
8. Authentication foundation
9. Public homepage
10. Course navigation
11. Initial tests
12. README and development instructions

Use the Spolk name and the provided brand assets.

If my exact logo is available in the working directory, use it. If not, reserve a marked logo asset location and continue rather than designing a replacement.

Do not create an unrelated brand.

Do not ask me questions during this initial development process unless continuing would be unsafe or would risk irreversible damage.

Make practical default decisions and document them.

Continue milestone by milestone until every feasible feature is implemented, integrated and tested.

**Your job is to build Spolk, not merely describe Spolk.**

**START CODING NOW.**

## How to use the prompt with Codex

Open [OpenAI Codex](https://chatgpt.com/codex?utm_source=chatgpt.com), create or select an empty repository named `spolk`, and paste the master prompt.

I recommend keeping the specification in your repository as `docs/MASTER_SPEC.md` so Codex can refer to it during later sessions. Have Codex maintain `docs/PROGRESS.md` with milestone status and testing evidence; that is especially important for a project this large.

One practical limitation: Codex may need you to resume work across multiple sessions because execution environments, context windows and tool limits are finite. The prompt tells it to continue autonomously where possible, but it cannot guarantee uninterrupted completion of a multi-month engineering project or defer every external decision if a real blocker occurs.

The first milestone to verify is the actual running website, with authentication, navigation, database migrations and a responsive homepage. Once that is solid, Codex should implement the LMS before the video and AI systems.