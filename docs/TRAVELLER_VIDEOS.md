# Traveller English video companions

The Spanish Tony Teacher playlist was removed from active course content on 2026-10-18 at the user’s request. Its page timings and custom 1A guide were removed. No database migration is needed.

## Current content

- 42 study lessons: all 40 main sections 1A–8E and two introductory study lessons.
- 25 distinct videos, all from the official BBC Learning English channel (`UCHaHD477h-FeBbVh9Sh7syA`).
- Every lesson mapping has a learning goal, listening focus and original speaking/application prompt.
- Videos are topic companions, not a page-by-page walkthrough of the Traveller book. A relevant short source may support several lessons with different practice prompts.
- Culture, module-opening, review and reference lessons retain their original reading activities instead of receiving unrelated videos. Exams retain their protected original listening tracks.
- Phone, technology and advice videos include extension material; the practice instructions identify this.

The active mapping and source URLs are in `apps/web/src/content/traveller-videos.json`. Administrators can inspect all mappings at `/admin/courses/traveller/videos`.

## Review evidence and limits

Checked official channel identity, video titles/descriptions, lengths, playability metadata and advertised English caption tracks using public YouTube responses. The BBC Easy English Conversations series publishes English-language teaching. Nine official English worksheets were retrieved from `https://downloads.bbc.co.uk/learningenglish/EEC/EEC_N%20worksheet.pdf` and inspected for lesson vocabulary and activities. Other attempted worksheet URLs were unavailable; they were not counted as reviewed.

A full audiovisual audit of all 25 clips has not been performed. Selected topics are based on official publisher content descriptions and available language metadata, not a claim that every spoken second has been watched. English captions are requested where available. YouTube controls regional availability and embedding.

Actual localhost Chromium playback of the replacement introduction video `I_tRSrPru94` advanced to 0:01 of 2:37. This is a playback check of that source, not proof of all videos in every browser.

## Learning flow

Course overview and the grouped sidebar combine original lessons, practice/homework indicators and installed scheduled exams in module order. Unreleased syllabus metadata is shown as locked; protected lesson content still comes through existing database row policies. The overview includes actual saved lesson completion, resume learning and exam dates.

Lesson activity flow: Watch (when mapped), Read & learn, Practice quiz (when assigned), Assignment / Grade & feedback, Notes, Finish lesson. Exam lessons use Timed exam instead of the reading/video path. Forms and quizzes remain mounted when switching activities to preserve local drafts; the video unmounts when leaving Watch. Drafts are not saved across reloads unless the existing form explicitly saves them.

Watching a video never changes course completion or grades. The existing completion RPC still enforces required quizzes and teacher review. Original scanned pages, assessment definitions, original exam media and existing student work are unchanged.

## Player

Sources load on request into the existing bounded iframe player. New sources use their full short duration, with no invented page subdivisions or old Spanish-video timestamps. At the boundary or native ended event, the iframe is removed and the completion dialog offers replay or staying in the activity. Continue to Read & learn below the player advances the activity explicitly.

VS Code preview can report YouTube HTML5 playback error 5. Use Chrome or Edge; errors show guidance and retry. The YouTube timeline represents the original source length.
