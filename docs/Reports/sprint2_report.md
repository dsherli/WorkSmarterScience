# Sprint 2 Report (10/06/25-11/05/25)
## YouTube link of Sprint 2 Video (Make this video unlisted)

## What's New (User Facing)
* Launched role-aware JWT login and registration so teachers and students can access personalized dashboards.
* Released a teacher dashboard to create classrooms, share join codes, and monitor roster status at a glance.
* Delivered a student dashboard that surfaces NGSS-aligned assignments, class join workflow, and progress summaries.
* Added an activity library and assessment view that lets learners preview full task context and submit responses without leaving the app.

## Work Summary (Developer Facing)
Over this sprint we wired the end-to-end authentication experience. Our Django app now exposes register, login, token refresh, and current-user endpoints via `students/views.py`, and the React client persists tokens through the shared `AuthContext`. On the instructor side we stood up the `classrooms` app (models, serializers, and REST views) so teachers can create classes, manage status, and distribute join codes, which the React `TeacherDashboard` consumes. For learners we introduced the new `StudentDashboard` that pulls NGSS activity metadata from the `science_activity` tables, normalizes media paths, and provides a class join flow backed by the `/api/classrooms/join/` endpoint. We also built the activity library and assessment reader, which hydrate assignments on demand and render associated media. Supporting infrastructure work included a Docker Compose stack for the full dev environment and a GitHub Actions CI workflow that runs pre-commit checks on every push.

## Unfinished Work
* Student submission pipeline and teacher review tooling still need backend endpoints and UI polish.
* AI assistant integration is limited to UI entry points; we deferred connecting to the actual evaluation service.
* Classroom grouping and bulk roster management are scoped but not yet started.

## Completed Issues/User Stories
* [#1 – Implement JWT authentication and login experience](https://github.com/dsherli/WorkSmarterScience/issues/1)
* [#11 – Build teacher dashboard and classroom management flows](https://github.com/dsherli/WorkSmarterScience/issues/11)
* [#16 – Surface NGSS activity catalog to students](https://github.com/dsherli/WorkSmarterScience/issues/16)
* [#19 – Stand up Docker-based dev environment and CI pipeline](https://github.com/dsherli/WorkSmarterScience/issues/19)

## Incomplete Issues/User Stories (TODO)
* [#15 – Preparing the project for deployment with CI/CD pipelines, and Azure research/test deploy](https://github.com/dsherli/WorkSmarterScience/issues/15) – We were unsure about which platforms to use for deployment (if we had credits), and held of to make MVP before deploy.
* [#22 – Teacher add students to group](https://github.com/dsherli/WorkSmarterScience/issues/22) – Was waiting on class creation and student join functionality, this should be done within a week.
* [#23 - Student submission](https://github.com/dsherli/WorkSmarterScience/issues/23) – Waiting on class creation and class joining, submissions will be sent to teachers by next week.
* [#24 - Teacher feedback](https://github.com/dsherli/WorkSmarterScience/issues/24) – Waiting on student submissions to reach teacher, this will be finished within the next two weeks.
* [#25 - AI chatbot for assignments](https://github.com/dsherli/WorkSmarterScience/issues/25) – AI evaluation for submissions needed to be finalized first, this will be done shortly using similar prompting.


## Code Files for Review
* [code/frontend/src/pages/TeacherDashboard.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/pages/TeacherDashboard.tsx)
* [code/frontend/src/pages/StudentDashboard.tsx](https://github.com/dsherli/WorkSmarterScience/blob/main/code/frontend/src/pages/StudentDashboard.tsx)
* [code/backend/classrooms/views.py](https://github.com/dsherli/WorkSmarterScience/blob/main/code/backend/classrooms/views.py)
* note: nearly all of the files in this project were created following the end of the first sprint, but the files listed above are the main files that have been utilized and worked on the most.

## Retrospective Summary
Here's what went well:
* Cross-functional pairing between frontend and backend reduced integration bugs.
* Docker Compose made it easy for the whole team to run the full stack locally.
* Pulling NGSS content directly into the dashboard created an immediate wow moment in demos.
* Shipped a large amount of features and elicited requirements as the team worked.

Here's what we'd like to improve:
* We still underestimate time required to harden new endpoints before exposing them.
* Test coverage around authentication regressions is thin and needs automation.
* Classroom membership edge cases (duplicate joins, role-based access) need more QA.
* AI evaluation needs more guardrails, needs to be very robust before any release.

Here are changes we plan to implement in the next sprint:
* Ship the student submission + teacher review flow end to end.
* Connect the AI helper to the evaluation service with first draft prompts.
* Add automated integration tests for auth and classroom APIs.
* Add group functionality with group evaluations for the AI.
