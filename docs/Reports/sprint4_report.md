# Sprint 4 Report (01/20/26 - 02/17/26)

## YouTube link of Sprint 4 Video (Make this video unlisted)


## What's New (User Facing)
* Implemented AI-powered rubric-based grading system allowing teachers to evaluate student submissions with automated feedback and scoring.
* Added group discussion feature enabling teachers to create table groups within classrooms and generate AI-driven discussion questions for students.
* Launched announcements system so teachers can create, edit, and delete announcements with file attachments within their classrooms.
* Introduced AI Assistant available on the teacher dashboard for contextual AI-powered chat completions and guidance.
* Added AI Insight panel on the teacher dashboard providing analytics and AI-generated observations on student performance.
* Built student management capabilities allowing teachers to view enrolled students, manage rosters, and monitor classroom membership.
* Added a notification system with badge indicators in the dashboard layout to alert users of new activity.

## Work Summary (Developer Facing)
This sprint focused on building the core AI-powered features that differentiate WorkSmarterScience. The grading subsystem (`grading/`) was stood up end-to-end: an `AIService` class wraps the OpenAI API to perform rubric-based grading (`grade_with_rubric`), evaluate student work, and generate feedback. Teachers can create and import rubrics, map them to activities, and review AI-generated grades before finalizing through the `SubmissionGrader` and `RubricGradingDemo` components. In parallel, the group discussion system was built across the `activity_groups` app — new models for groups, group activities, and AI prompts were created, with views to generate discussion questions per group, release them to students, and allow teacher editing for quality control. The frontend surfaces this through `TeacherGroupPage`, `StudentGroupPage`, and `StudentGroupDiscussionPage`. Announcements were integrated directly into the `ClassroomPage` component with full CRUD operations backed by new Django migrations. We also began work on deployment configuration, adding trusted origins for production hosting, and contributed toward an AIED 2026 paper submission. A multi-agent discussion system branch was started exploring heterogeneous and cognitive conflict approaches for richer AI-facilitated group conversations.

## Unfinished Work
* **Group Discussion** is functional but still being refined — the multi-agent discussion system (heterogeneous + cognitive conflict approach) is in active development on a separate branch.
* **AI Assistant** has foundational chat completion endpoints but needs additional polish and context-awareness for production use.
* **AI Insight** dashboard analytics are partially implemented and require further integration with grading data.
* **Student Management** covers basic roster viewing but still needs bulk management and advanced role-based controls.
* **Deployment** is on-going — trusted origins have been configured but full production deployment to a cloud platform is not yet complete.

## Completed Issues/User Stories
Here are links to the issues that we completed in this sprint:

* [Implemented main features for the AI grading system](https://github.com/dsherli/WorkSmarterScience/commit/b8e3fa8) — Full rubric-based AI grading pipeline with teacher review
* [Announcement feature](https://github.com/dsherli/WorkSmarterScience/commit/51dde23) — Teachers can create, edit, and delete announcements in classrooms
* [Created new models, schema, urls, APIs for group and group activities](https://github.com/dsherli/WorkSmarterScience/commit/51f0331) — Backend infrastructure for the group discussion system
* [Added frontend base and AI foundation for the group discussion system](https://github.com/dsherli/WorkSmarterScience/commit/a8604bd) — Student and teacher group discussion UI
* [Added teacher side UI and AI infrastructure updates with migration to allow releasing questions](https://github.com/dsherli/WorkSmarterScience/commit/3f9286f) — Teachers can generate, edit, and release AI discussion questions
* [Added textbox for students](https://github.com/dsherli/WorkSmarterScience/commit/70c94e2) — Students can respond to group discussion prompts
* [Added trusted origins for deployment](https://github.com/dsherli/WorkSmarterScience/commit/85ef497) — Deployment configuration updates
* AIED 2026 Paper Submission — finalized and our paper has been submitted

## Incomplete Issues/User Stories
Here are links to issues we worked on but did not complete in this sprint:

* Multi-agent discussion system — We began exploring heterogeneous and cognitive conflict approaches for richer AI-facilitated discussions, but the feature is still in an experimental branch and needs further testing.
* Full production deployment — Trusted origins were configured, but the complete deployment pipeline to a cloud platform has not been finalized due to ongoing infrastructure decisions.


## Code Files for Review
Please review the following code files, which were actively developed during this sprint, for quality:

* [grading/views.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/grading/views.py)
* [grading/ai_service.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/grading/ai_service.py)
* [grading/models.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/grading/models.py)
* [activity_groups/views.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/activity_groups/views.py)
* [activity_groups/models.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/activity_groups/models.py)
* [ClassroomPage.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/pages/ClassroomPage.tsx)
* [TeacherGroupPage.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/pages/TeacherGroupPage.tsx)
* [StudentGroupDiscussionPage.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/pages/StudentGroupDiscussionPage.tsx)
* [SubmissionGrader.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/components/SubmissionGrader.tsx)

## Retrospective Summary
Here's what went well:
* Successfully delivered the end-to-end AI grading pipeline with rubric support, a major milestone for the project.
* Group discussion system was built across both frontend and backend with AI question generation and teacher quality control in a short timeframe.
* Announcements feature was scoped, built, and integrated cleanly into the existing classroom page.
* Team explored advanced multi-agent AI architectures (heterogeneous + cognitive conflict) for future improvements.
* Finalized the AIED 2026 paper submission

Here's what we'd like to improve:
* Several features (AI Assistant, AI Insight, Student Management) are partially complete and need dedicated focus to finish.
* Deployment pipeline needs to be prioritized so the application can be tested in a production-like environment.
* Test coverage for the new AI-driven features is minimal and needs to be expanded.
* The multi-agent discussion system branch diverged significantly and will need careful integration.

Here are changes we plan to implement in the next sprint:
* Finalize and merge the multi-agent discussion system for richer AI-facilitated group conversations.
* Complete deployment to a cloud platform with CI/CD pipeline.
* Polish AI Assistant and AI Insight features for production readiness.
* Expand student management with bulk operations and role-based access controls.
* Add automated tests for the grading and group discussion APIs.
.
