-- Run in Supabase SQL Editor AFTER SETUP_ONCE.sql.
-- Adds sample learning content; never creates passwords, fake submissions, or grades.
-- Existing content and student work are preserved on reruns.
begin;
do $$
declare
 student_email text := 'henok.tarikuu@astu.edu.et';
 -- NULL uses the only existing administrator as the teacher for this test.
 -- Set an existing teacher email here if you want a separate account.
 teacher_email text := null;
 student_id uuid;
 teacher_id uuid;
 cid uuid;
 school_id uuid;
 candidates integer;
 module_id uuid := 'd1000000-0000-4000-8000-000000000001';
 first_lesson uuid := 'd1000000-0000-4000-8000-000000000002';
 next_lesson uuid := 'd1000000-0000-4000-8000-000000000003';
 assignment_id uuid := 'd1000000-0000-4000-8000-000000000004';
 quiz_id uuid := 'd1000000-0000-4000-8000-000000000005';
 session_id uuid := 'd1000000-0000-4000-8000-000000000006';
 source_id uuid := 'd1000000-0000-4000-8000-000000000007';
begin
 select id into student_id from auth.users where lower(email)=lower(student_email);
 if student_id is null then raise exception 'Create the student account % in Authentication > Users first.',student_email;end if;
 if exists(select 1 from public.user_roles where account_id=student_id and role in ('admin','super_admin','teacher')) then
 raise exception 'The selected student has a staff role. Use a separate student account for isolation testing.';
 end if;
 if teacher_email is null then
 select count(distinct account_id) into candidates from public.user_roles where role in ('admin','super_admin');
 if candidates<>1 then raise exception 'Set teacher_email at the top to the exact existing teacher/admin email (% administrators found).',candidates;end if;
 select account_id into teacher_id from public.user_roles where role in ('admin','super_admin') limit 1;
 else
 select id into teacher_id from auth.users where lower(email)=lower(teacher_email);
 end if;
 if teacher_id is null or teacher_id=student_id then raise exception 'A distinct existing teacher/admin account is required.';end if;
 insert into public.profiles(id) values(student_id),(teacher_id) on conflict(id) do nothing;
 insert into public.user_roles(account_id,role) values(student_id,'student'),(teacher_id,'teacher') on conflict do nothing;
 select id into school_id from public.schools where slug='general';
 if school_id is null then raise exception 'Run the initial database setup first.';end if;
 insert into public.courses(school_id,slug,title,level,description,published)
 values(school_id,'everyday-english','English for everyday life','A2','Everyday conversations and meaningful practice.',true) on conflict(slug) do nothing;
 select id into cid from public.courses where slug='everyday-english';
 insert into public.course_instructors(course_id,account_id) values(cid,teacher_id) on conflict do nothing;
 insert into public.course_enrollments(course_id,account_id) values(cid,student_id) on conflict do nothing;
 insert into public.modules(id,course_id,title,position) values(module_id,cid,'Demo: everyday conversations',100) on conflict(id) do nothing;
 insert into public.lessons(id,module_id,course_id,title,body,position,released_at) values
 (first_lesson,module_id,cid,'Demo 1: Introduce yourself','Introduce yourself with: Hello, my name is ___. I am from ___. I study ___. In my free time, I enjoy ___. Ask a friendly follow-up: What do you enjoy doing? Example: Hello, my name is Alex. I study engineering. In my free time, I enjoy reading. Use complete sentences. Finish the short quiz, submit your introduction, and mark this lesson complete to unlock Demo 2.',0,now()-interval '1 day'),
 (next_lesson,module_id,cid,'Demo 2: Daily routines','Describe a daily routine using the present simple: I study in the morning. I work in the afternoon. I read in the evening. Ask: What do you do in the morning? Write three sentences about your own routine.',1,now()-interval '1 day') on conflict(id) do nothing;
 insert into public.lesson_prerequisites(lesson_id,prerequisite_id) values(next_lesson,first_lesson) on conflict do nothing;
 insert into public.assignments(id,lesson_id,course_id,title,instructions,due_at)
 values(assignment_id,first_lesson,cid,'Demo homework: a friendly introduction','Write 4–6 sentences introducing yourself, your studies, and one interest. End with a friendly question. This is a sample task for testing submission and teacher feedback.',now()+interval '7 days') on conflict(id) do nothing;
 insert into public.assessments(id,course_id,lesson_id,title,time_limit_seconds,attempt_limit,passing_score)
 values(quiz_id,cid,first_lesson,'Demo quiz: first conversations',900,3,70) on conflict(id) do nothing;
 insert into public.assessment_questions(id,assessment_id,kind,prompt,options,correct_answer,points,position) values
 ('d1000000-0000-4000-8000-000000000011',quiz_id,'multiple_choice','Which sentence introduces you?','["Hello, my name is Alex.","What time is it?","Good night."]','Hello, my name is Alex.',1,0),
 ('d1000000-0000-4000-8000-000000000012',quiz_id,'short_answer','Complete the sentence with one word: It is nice to ___ you.','[]','meet',1,1) on conflict(id) do nothing;
 insert into public.live_sessions(id,course_id,title,starts_at,ends_at,recording_allowed)
 values(session_id,cid,'Demo class: friendly introductions',now()+interval '5 minutes',now()+interval '65 minutes',false) on conflict(id) do nothing;
 insert into public.live_session_invites(session_id,account_id,expires_at)
 select session_id,student_id,ends_at from public.live_sessions where id=session_id on conflict do nothing;
 insert into public.ai_knowledge_documents(id,course_id,title,uploaded_by,lesson_id,published)
 values(source_id,cid,'Demo introduction notes',teacher_id,first_lesson,true) on conflict(id) do nothing;
 insert into public.ai_document_chunks(id,document_id,content,position)
 values('d1000000-0000-4000-8000-000000000008',source_id,'A friendly introduction starts with hello and your name. Introduce yourself with: Hello, my name is Alex. Say what you study and one thing you enjoy. A friendly follow-up question is: What do you enjoy doing?',0) on conflict(id) do nothing;
 insert into public.notifications(id,account_id,event,body)
 values('d1000000-0000-4000-8000-000000000009',student_id,'lesson_unlocked','Sample course ready: open My learning, choose English for everyday life, then Demo 1: Introduce yourself.') on conflict(id) do nothing;
 insert into public.audit_logs(actor_id,event,resource_id) values(teacher_id,'demo.prepared',cid);
end;
$$;
commit;
-- Verify the exact student/teacher accounts and enrollment without exposing passwords.
select u.email, r.role from auth.users u join public.user_roles r on r.account_id=u.id
where u.id in (
 select account_id from public.course_enrollments where course_id=(select id from public.courses where slug='everyday-english')
 union select account_id from public.course_instructors where course_id=(select id from public.courses where slug='everyday-english')
) order by u.email,r.role;
