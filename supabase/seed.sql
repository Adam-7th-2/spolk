-- Curriculum fixtures only. No real people or fabricated achievements.
insert into public.schools(name,slug,published) values
('Kids English','kids',true),('School English','school',true),('General English','general',true),('Business English','business',true),('Academic English','academic',true),('English for IT and Engineering','tech',true),('IELTS and TOEFL','exams',true),('Conversational English','conversation',true),('Job Interviews','interviews',true),('Research and University','research',true) on conflict(slug) do nothing;
insert into public.courses(school_id,slug,title,level,description,published)
select s.id,v.slug,v.title,v.level,v.description,true from (values
('general','everyday-english','English for everyday life','A2','Everyday conversations, useful phrases, and clear messages.'),
('business','business-english','Make yourself heard at work','B1','Professional communication for meetings and presentations.'),
('conversation','conversation','Less overthinking. More speaking.','B1','Build fluency through purposeful conversation.'),
('kids','young-explorers','Big discoveries for little learners','A1','Age-appropriate stories and everyday vocabulary.'),
('exams','ielts','Your next chapter starts here','B2','Structured preparation for academic English examinations.'),
('tech','english-for-tech','Connect beyond the code','B1','Technical communication and collaboration.')
) as v(school,slug,title,level,description) join public.schools s on s.slug=v.school on conflict(slug) do nothing;
insert into public.modules(course_id,title,position) select id,'Your first conversations',0 from public.courses where slug='everyday-english' on conflict(course_id,position) do nothing;
insert into public.lessons(module_id,course_id,title,body,position,released_at) select m.id,m.course_id,'Hello, world: introducing yourself','A simple introduction can open a conversation. Say: Hello, my name is ___. I am from ___. It is nice to meet you. Ask a follow-up question: What do you like to do in your free time? Practice writing your own introduction, then read it out loud.',0,now() from public.modules m join public.courses c on c.id=m.course_id where c.slug='everyday-english' on conflict(module_id,position) do nothing;

insert into public.assessments(id,course_id,lesson_id,title) select '10000000-0000-0000-0000-000000000001',l.course_id,l.id,'A confident first hello' from public.lessons l join public.courses c on c.id=l.course_id where c.slug='everyday-english' and l.position=0 on conflict(id) do nothing;
insert into public.assessment_questions(assessment_id,kind,prompt,options,correct_answer,position) values('10000000-0000-0000-0000-000000000001','multiple_choice','Which sentence introduces you?','["Hello, my name is Alex.","Where is the station?","It is raining."]','Hello, my name is Alex.',0) on conflict(assessment_id,position) do nothing;
