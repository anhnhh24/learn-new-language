create table learning.topic_learning_guides (
    topic_id uuid primary key references learning.knowledge_topics(id),
    formula_patterns jsonb not null,
    application_steps jsonb not null,
    extensions jsonb not null,
    self_check_prompts jsonb not null,
    check (jsonb_typeof(formula_patterns) = 'array'),
    check (jsonb_typeof(application_steps) = 'array'),
    check (jsonb_typeof(extensions) = 'array'),
    check (jsonb_typeof(self_check_prompts) = 'array')
);

insert into learning.course_versions
    (id, course_id, version, slug, title, summary, language, exam_profile, scope,
     level_label, state, author_name, rights_reference, estimated_minutes,
     created_at, published_at)
values
    ('60000000-0000-4000-8000-000000000001',
     '60000000-0000-4000-8000-000000000000',
     '2026.09-v1', 'toeic-reading-grammar-foundation',
     'TOEIC Reading: Ngữ pháp và từ vựng từ nền tảng đến nâng cao',
     'Lộ trình 31 tuần có thể học theo nhịp riêng, tập trung ngữ pháp, từ vựng kinh doanh và kỹ năng Part 5/6. Đây không phải cam kết tổng điểm TOEIC và không thay thế lộ trình Listening.',
     'vi', 'TOEIC-2026', 'Reading grammar, business vocabulary, Part 5 and Part 6 integration',
     'Nền tảng đến nâng cao', 'Published', 'TOEIC Learning Editorial Team',
     'USER_SUPPLIED_OUTLINE_AND_ORIGINAL_EDITORIAL_EXPANSION_V1',
     4200, '2026-09-22T00:00:00Z', '2026-09-22T00:00:00Z');

insert into learning.curriculum_levels
    (id, course_version_id, code, title, sequence, recommended_weeks,
     entry_guidance, outcome_guidance, checkpoint_question_count, checkpoint_pass_rate)
values
    ('61000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',
     'A','A — Củng cố nền tảng',1,6,
     'Phù hợp khi kiến thức câu và từ loại chưa ổn định hoặc người học chủ động chọn bắt đầu lại từ nền.',
     'Nhận diện cấu trúc câu cơ bản và xử lý câu Part 5 nền tảng; kết quả là chỉ báo học tập, không quy đổi band.',25,0.7000),
    ('61000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001',
     'B','B — Trung cấp ứng dụng',2,7,
     'Phù hợp sau checkpoint A hoặc khi placement cho thấy nền tảng cơ bản đã ổn.',
     'Vận dụng thì hoàn thành, bị động, mệnh đề và liên kết trong Part 5/6 ở mức trung bình.',40,0.7000),
    ('61000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000001',
     'C','C — Nâng cao có kiểm soát',3,8,
     'Phù hợp sau checkpoint B; không tự mở chỉ dựa trên điểm tự khai.',
     'Xử lý cấu trúc nâng cao và giải thích được dấu hiệu chọn đáp án trong ngữ cảnh Reading.',40,0.7500),
    ('61000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000001',
     'D','D — Chuyên sâu Part 5/6',4,10,
     'Phù hợp sau checkpoint C hoặc bằng chứng thực hành tương đương; placement ngắn không tự gợi ý mức này.',
     'Tăng độ chính xác với collocation, register, cấu trúc rút gọn và bẫy Part 5/6; không phải chứng nhận 900+.',46,0.8500);

insert into learning.course_modules
    (id, course_version_id, level_id, code, title, summary, sequence)
values
    ('62000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000001',
     'MODULE-A','Nền câu và từ loại','Dựng lại cấu trúc câu, thì cơ bản và nhóm danh từ.',1),
    ('62000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000002',
     'MODULE-B','Cấu trúc trung cấp','Các thì hoàn thành, bị động, điều kiện, mệnh đề và giới từ.',2),
    ('62000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000003',
     'MODULE-C','Cấu trúc nâng cao','Đảo ngữ, rút gọn, song song, giả định và nhấn mạnh.',3),
    ('62000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000001','61000000-0000-4000-8000-000000000004',
     'MODULE-D','Độ chính xác chuyên sâu','Word form, collocation, register, transitions và cấu trúc nén.',4);

insert into learning.placement_recommendation_rules
    (id, course_version_id, policy_version, minimum_answered, correct_min, correct_max,
     recommended_level_id, guidance_label, is_certification_claim)
values
    ('66000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000001',
     'placement-v1',18,0,11,'61000000-0000-4000-8000-000000000001','Củng cố căn bản',false),
    ('66000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000001',
     'placement-v1',18,12,18,'61000000-0000-4000-8000-000000000002','Căn bản mở rộng',false),
    ('66000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000001',
     'placement-v1',18,19,24,'61000000-0000-4000-8000-000000000003','Tiền trung cấp',false);

with topic_data(level_code, sequence, code, title_vi, title_en, category, primary_tag,
    summary, objectives, core, traps, examples, vocabulary_theme, minutes) as (values
('A',1,'A1','Từ loại và vị trí trong câu','Parts of speech','Grammar','grammar.parts_of_speech',
 'Nhận diện danh từ, động từ, tính từ và trạng từ bằng vị trí, hậu tố và vai trò thay vì chỉ dịch nghĩa.',
 '["Phân biệt bốn từ loại chính","Dùng vị trí quanh động từ và danh từ để loại đáp án","Nhận diện hậu tố thường gặp"]'::jsonb,
 '["Danh từ thường đứng sau mạo từ hoặc tính từ","Tính từ bổ nghĩa danh từ và đứng sau linking verb","Trạng từ bổ nghĩa động từ, tính từ hoặc cả mệnh đề","Động từ phải hòa hợp với chủ ngữ và thời"]'::jsonb,
 '["Chọn trạng từ chỉ vì có đuôi -ly dù chỗ trống cần tính từ","Nhầm danh từ chỉ người với danh từ chỉ vật","Dịch từng đáp án mà bỏ qua vị trí ngữ pháp"]'::jsonb,
 '[{"sentence":"The manager gave a clear explanation.","focus":"clear là tính từ bổ nghĩa explanation"},{"sentence":"Sales increased significantly.","focus":"significantly bổ nghĩa increased"}]'::jsonb,
 'Văn phòng và chức danh',40),
('A',2,'A2','Cấu trúc câu S–V–O và thành phần bổ sung','Sentence patterns','Grammar','grammar.sentence_structure',
 'Xác định chủ ngữ, động từ chính, tân ngữ, bổ ngữ và trạng ngữ trong câu kinh doanh.',
 '["Tìm động từ chính trước khi chọn đáp án","Phân biệt tân ngữ với bổ ngữ","Nhận ra câu thiếu chủ ngữ hoặc động từ"]'::jsonb,
 '["Mệnh đề độc lập cần chủ ngữ và động từ hữu hạn","Động từ ngoại động thường cần tân ngữ","Linking verb nối chủ ngữ với bổ ngữ","Cụm giới từ không thay thế động từ chính"]'::jsonb,
 '["Coi danh từ trong cụm giới từ là chủ ngữ","Chọn thêm động từ hữu hạn khi câu đã có động từ","Bỏ qua chủ ngữ giả it hoặc there"]'::jsonb,
 '[{"sentence":"The committee approved the revised budget.","focus":"committee=S, approved=V, budget=O"},{"sentence":"The conference room is available.","focus":"available là bổ ngữ sau linking verb"}]'::jsonb,
 'Cơ cấu công ty',45),
('A',3,'A3','Hiện tại đơn và hiện tại tiếp diễn','Present simple and continuous','Grammar','grammar.present_tenses',
 'Chọn thì theo lịch cố định, sự thật, trạng thái hoặc hành động đang diễn ra/tạm thời.',
 '["Phân biệt thói quen với tình huống tạm thời","Nhận diện trạng từ tần suất và dấu hiệu hiện tại","Tránh dùng tiếp diễn với động từ trạng thái phổ biến"]'::jsonb,
 '["Hiện tại đơn dùng cho lịch, quy trình, trạng thái và thói quen","Hiện tại tiếp diễn dùng cho hành động đang diễn ra hoặc xu hướng tạm thời","Lịch tương lai cố định có thể dùng hiện tại đơn","always với tiếp diễn có thể diễn tả sự phàn nàn"]'::jsonb,
 '["Dùng tiếp diễn với know, belong, need trong nghĩa trạng thái","Thấy now nhưng không kiểm tra chủ ngữ và dạng be + V-ing","Nhầm lịch cố định với dự định cá nhân"]'::jsonb,
 '[{"sentence":"The branch opens at 8:30 every weekday.","focus":"lịch cố định"},{"sentence":"We are updating the customer database this week.","focus":"hoạt động tạm thời"}]'::jsonb,
 'Lịch làm việc và quy trình',40),
('A',4,'A4','Quá khứ đơn và quá khứ tiếp diễn','Past simple and continuous','Grammar','grammar.past_tenses',
 'Mô tả sự kiện đã hoàn tất và hành động nền đang diễn ra tại một thời điểm trong quá khứ.',
 '["Chọn quá khứ đơn cho sự kiện hoàn tất","Dùng quá khứ tiếp diễn cho hành động nền","Kết hợp when và while đúng quan hệ thời gian"]'::jsonb,
 '["Quá khứ đơn đi với mốc thời gian đã kết thúc","Quá khứ tiếp diễn nhấn mạnh quá trình tại thời điểm quá khứ","When thường giới thiệu sự kiện xen vào; while thường đi với hành động kéo dài"]'::jsonb,
 '["Dùng hiện tại hoàn thành với yesterday hoặc last week","Lạm dụng tiếp diễn cho động từ trạng thái","Bỏ qua động từ bất quy tắc"]'::jsonb,
 '[{"sentence":"The courier arrived while we were preparing the documents.","focus":"arrived xen vào hành động đang diễn ra"},{"sentence":"The company relocated in 2024.","focus":"mốc đã kết thúc"}]'::jsonb,
 'Giao nhận và lịch sử công ty',40),
('A',5,'A5','Các cách diễn đạt tương lai','Future forms','Grammar','grammar.future_forms',
 'Phân biệt will, be going to, hiện tại tiếp diễn và lịch cố định khi nói về tương lai.',
 '["Chọn dạng tương lai theo quyết định, dự đoán, kế hoạch và lịch","Dùng mệnh đề thời gian tương lai đúng thì","Nhận diện future in the past ở mức cơ bản"]'::jsonb,
 '["Will dùng cho quyết định tức thời hoặc dự đoán trung tính","Be going to dùng cho ý định hoặc bằng chứng hiện tại","Hiện tại tiếp diễn dùng cho sắp xếp đã chốt","Sau when, once, until trong mệnh đề thời gian thường dùng hiện tại"]'::jsonb,
 '["Dùng will sau as soon as trong mệnh đề thời gian","Nhầm lịch hệ thống với kế hoạch cá nhân","Chọn be going to khi câu chỉ có dự đoán không bằng chứng"]'::jsonb,
 '[{"sentence":"We will send the invoice once the order is confirmed.","focus":"mệnh đề once dùng hiện tại đơn"},{"sentence":"The team is meeting the supplier on Friday.","focus":"sắp xếp đã chốt"}]'::jsonb,
 'Kế hoạch và lịch hẹn',40),
('A',6,'A6','Danh từ đếm được và không đếm được','Count and noncount nouns','Grammar','grammar.noun_countability',
 'Chọn lượng từ, số ít/số nhiều và động từ phù hợp với danh từ trong ngữ cảnh công việc.',
 '["Phân loại danh từ theo nghĩa trong ngữ cảnh","Chọn much, many, fewer, less và lượng từ trung tính","Kiểm tra hòa hợp chủ vị"]'::jsonb,
 '["Danh từ đếm được số ít cần determiner","Danh từ không đếm được thường không dùng a/an hoặc số nhiều","A lot of, some, enough dùng được với cả hai nhóm","Information, equipment, advice thường không đếm được"]'::jsonb,
 '["Dùng informations hoặc equipments","Nhầm fewer với less","Bỏ qua nghĩa thay đổi như paper hoặc experience"]'::jsonb,
 '[{"sentence":"The office needs additional equipment.","focus":"equipment không đếm được"},{"sentence":"Fewer applicants attended the second interview.","focus":"applicants đếm được"}]'::jsonb,
 'Mua sắm và đặt hàng',40),
('A',7,'A7','Mạo từ và từ hạn định','Articles and determiners','Grammar','grammar.articles',
 'Dùng a/an, the hoặc zero article dựa trên tính xác định, lần nhắc và loại danh từ.',
 '["Xác định danh từ mới hay đã biết","Phân biệt nghĩa khái quát với đối tượng cụ thể","Dùng a/an theo âm đầu"]'::jsonb,
 '["A/an giới thiệu danh từ đếm được số ít chưa xác định","The dùng khi người đọc xác định được đối tượng","Zero article thường dùng với danh từ số nhiều hoặc không đếm được mang nghĩa chung","Tên phòng ban hoặc chức danh phụ thuộc ngữ cảnh cụ thể"]'::jsonb,
 '["Chọn an theo chữ viết thay vì âm","Dùng the cho mọi danh từ đã dịch là cái","Bỏ determiner trước danh từ đếm được số ít"]'::jsonb,
 '[{"sentence":"Please send me an updated estimate.","focus":"updated bắt đầu bằng nguyên âm khi phát âm"},{"sentence":"The estimate you requested is attached.","focus":"estimate đã được xác định"}]'::jsonb,
 'Tài liệu và thiết bị văn phòng',35),
('A',8,'A8','Đại từ và từ sở hữu','Pronouns and possessives','Grammar','grammar.pronouns',
 'Chọn đại từ chủ ngữ, tân ngữ, phản thân, sở hữu và từ hạn định sở hữu theo chức năng.',
 '["Xác định chức năng của chỗ trống","Bảo đảm đại từ có antecedent rõ","Phân biệt its và it is trong ngữ cảnh"]'::jsonb,
 '["Đại từ chủ ngữ đứng trước động từ; tân ngữ đứng sau động từ hoặc giới từ","Tính từ sở hữu phải đi với danh từ; đại từ sở hữu đứng độc lập","Đại từ phản thân dùng khi chủ thể và đối tượng trùng nhau hoặc để nhấn mạnh"]'::jsonb,
 '["Dùng myself thay cho me để nghe trang trọng","Nhầm their, theirs và them","Đại từ số ít không khớp antecedent số nhiều"]'::jsonb,
 '[{"sentence":"The clients sent us their revised requirements.","focus":"us là tân ngữ; their bổ nghĩa requirements"},{"sentence":"The director prepared the slides herself.","focus":"herself nhấn mạnh chủ thể"}]'::jsonb,
 'Giao tiếp nội bộ',35),
('A',9,'A9','So sánh cơ bản','Basic comparisons','Grammar','grammar.comparison_basic',
 'Dùng so sánh hơn, nhất và cấu trúc bằng nhau với tính từ/trạng từ thường gặp.',
 '["Tạo dạng so sánh đúng","Chọn than, as...as và the trong so sánh nhất","So sánh các đối tượng cùng loại"]'::jsonb,
 '["Tính từ ngắn thường thêm -er/-est; tính từ dài dùng more/most","As + adjective/adverb + as diễn tả ngang bằng","So sánh nhất thường cần phạm vi","Much, far, slightly có thể bổ nghĩa so sánh hơn"]'::jsonb,
 '["Dùng more easier","So sánh price với một company thay vì price khác","Bỏ than hoặc phạm vi so sánh nhất"]'::jsonb,
 '[{"sentence":"This route is considerably faster than the old one.","focus":"considerably bổ nghĩa comparative"},{"sentence":"It is the most efficient option in the proposal.","focus":"so sánh nhất trong phạm vi"}]'::jsonb,
 'Chi phí và hiệu suất',40),
('B',1,'B1','Hiện tại hoàn thành','Present perfect','Grammar','grammar.present_perfect',
 'Liên hệ trải nghiệm hoặc sự việc trong quá khứ với hiện tại và phân biệt với quá khứ đơn.',
 '["Dùng since, for, already, yet và recently","Phân biệt thời gian chưa kết thúc với mốc đã kết thúc","Chọn have/has phù hợp chủ ngữ"]'::jsonb,
 '["Present perfect dùng khi thời điểm không nêu hoặc kết quả còn liên quan hiện tại","Since chỉ điểm bắt đầu; for chỉ khoảng thời gian","Quá khứ đơn dùng với mốc đã kết thúc","This week có thể dùng present perfect nếu tuần chưa kết thúc"]'::jsonb,
 '["Dùng present perfect với last year","Nhầm since và for","Dùng been và gone không đúng ý nghĩa"]'::jsonb,
 '[{"sentence":"The HR team has interviewed twelve candidates this week.","focus":"tuần hiện tại chưa kết thúc"},{"sentence":"The HR team interviewed five candidates yesterday.","focus":"mốc đã kết thúc"}]'::jsonb,
 'Nhân sự và tuyển dụng',45),
('B',2,'B2','Quá khứ hoàn thành','Past perfect','Grammar','grammar.past_perfect',
 'Làm rõ sự kiện xảy ra trước một mốc hoặc sự kiện khác trong quá khứ.',
 '["Sắp xếp hai sự kiện quá khứ","Nhận diện by the time và already","Tránh dùng past perfect khi thứ tự đã rõ và không cần nhấn mạnh"]'::jsonb,
 '["Past perfect diễn tả hành động hoàn tất trước một điểm quá khứ","Mệnh đề còn lại thường dùng past simple","After và before có thể làm thứ tự rõ; past perfect vẫn dùng khi cần nhấn mạnh kết quả trước đó"]'::jsonb,
 '["Dùng past perfect cho mọi động từ quá khứ","Đảo thứ tự sự kiện do chỉ nhìn vị trí mệnh đề","Nhầm had + past participle với had như động từ sở hữu"]'::jsonb,
 '[{"sentence":"By the time the auditor arrived, the team had prepared all records.","focus":"chuẩn bị xảy ra trước lúc auditor đến"},{"sentence":"She discovered that the vendor had changed its address.","focus":"thay đổi xảy ra trước lúc phát hiện"}]'::jsonb,
 'Hồ sơ và kiểm toán',40),
('B',3,'B3','Tương lai tiếp diễn và tương lai hoàn thành','Future continuous and perfect','Grammar','grammar.future_advanced',
 'Phân biệt hành động đang diễn ra tại mốc tương lai với hành động hoàn tất trước mốc đó.',
 '["Dùng will be V-ing cho hoạt động tại mốc tương lai","Dùng will have V3 với by + mốc","Đánh giá khi dạng đơn giản tự nhiên hơn"]'::jsonb,
 '["Future continuous nhấn mạnh tiến trình dự kiến","Future perfect nhấn mạnh hoàn tất trước deadline","By next Friday thường gợi ý future perfect; at this time tomorrow thường gợi ý future continuous"]'::jsonb,
 '["Chọn future perfect chỉ vì thấy future word","Nhầm by với until","Dùng dạng phức tạp khi câu chỉ nói lịch đơn"]'::jsonb,
 '[{"sentence":"At 10 a.m. tomorrow, the team will be presenting the proposal.","focus":"đang diễn ra tại mốc tương lai"},{"sentence":"By Friday, we will have completed the inventory count.","focus":"hoàn tất trước hạn"}]'::jsonb,
 'Dự án và deadline',40),
('B',4,'B4','Câu bị động','Passive voice','Grammar','grammar.passive',
 'Chọn chủ động hoặc bị động theo trọng tâm thông tin và tạo đúng be + past participle.',
 '["Nhận diện khi chủ ngữ nhận hành động","Chia be theo thì và chủ ngữ","Quyết định khi nào cần by-agent"]'::jsonb,
 '["Passive = be ở thì phù hợp + past participle","Dùng bị động khi tác nhân không biết, không quan trọng hoặc muốn nhấn mạnh kết quả","Chỉ ngoại động từ mới chuyển sang bị động trực tiếp"]'::jsonb,
 '["Thiếu be hoặc dùng V2 thay V3","Giữ tân ngữ sau động từ bị động sai cấu trúc","Dùng by-agent không cần thiết"]'::jsonb,
 '[{"sentence":"All expense reports must be submitted by Monday.","focus":"modal passive"},{"sentence":"The maintenance team repaired the elevator.","focus":"chủ động vì tác nhân quan trọng"}]'::jsonb,
 'Quy trình và tuân thủ',45),
('B',5,'B5','Câu điều kiện loại 0, 1 và 2','Conditionals 0, 1 and 2','Grammar','grammar.conditionals_basic',
 'Chọn cấu trúc điều kiện theo sự thật, khả năng thực tế hoặc giả định hiện tại.',
 '["Phân loại mức độ thực của điều kiện","Dùng thì đúng trong if-clause","Phân biệt unless với if not"]'::jsonb,
 '["Zero: present + present cho quy luật","First: present + will/modal cho khả năng tương lai","Second: past + would cho giả định ít thực ở hiện tại/tương lai","Unless mang nghĩa if not và không đi với phủ định kép"]'::jsonb,
 '["Dùng will trực tiếp trong if-clause thông thường","Trộn second conditional với kết quả thực tế","Dùng unless...not"]'::jsonb,
 '[{"sentence":"If the shipment arrives today, we will process it immediately.","focus":"first conditional"},{"sentence":"If we had more storage space, we would keep additional stock.","focus":"second conditional"}]'::jsonb,
 'Hợp đồng và giao nhận',45),
('B',6,'B6','Động từ khuyết thiếu','Modal verbs','Grammar','grammar.modals',
 'Diễn đạt nghĩa vụ, khả năng, lời khuyên, suy đoán và sự cho phép với modal phù hợp.',
 '["Phân biệt must, have to, should và may","Tạo modal passive","Đọc sắc thái chắc chắn trong quy định và thông báo"]'::jsonb,
 '["Modal + bare infinitive","Must not là cấm; do not have to là không bắt buộc","May/might diễn tả khả năng; should diễn tả lời khuyên hoặc kỳ vọng","Modal passive = modal + be + V3"]'::jsonb,
 '["Nhầm must not với do not have to","Thêm to sau modal","Dùng can cho quy định bắt buộc"]'::jsonb,
 '[{"sentence":"Visitors must wear an identification badge.","focus":"nghĩa vụ"},{"sentence":"The delivery may be delayed by severe weather.","focus":"khả năng và bị động"}]'::jsonb,
 'Quy định nơi làm việc',40),
('B',7,'B7','Danh động từ và động từ nguyên mẫu','Gerunds and infinitives','Grammar','grammar.gerunds_infinitives',

 'Chọn V-ing, to-infinitive hoặc bare infinitive theo động từ, giới từ và ý nghĩa.',
 '["Nhớ nhóm động từ thường gặp theo pattern","Dùng V-ing sau giới từ","Phân biệt stop/remember/try khi đổi dạng làm đổi nghĩa"]'::jsonb,
 '["Giới từ theo sau bởi noun hoặc V-ing","Decide, plan, agree thường đi với to-infinitive","Avoid, consider, finish thường đi với V-ing","Một số động từ đổi nghĩa theo complement"]'::jsonb,
 '["Chọn theo dịch nghĩa mà không xét pattern","Dùng to V sau giới từ","Nhầm used to V với be used to V-ing"]'::jsonb,
 '[{"sentence":"The board agreed to postpone the launch.","focus":"agree + to-infinitive"},{"sentence":"Please avoid sharing confidential files.","focus":"avoid + V-ing"}]'::jsonb,
 'Họp và ra quyết định',45),
('B',8,'B8','Mệnh đề quan hệ','Relative clauses','Grammar','grammar.relative_clauses',
 'Nối thông tin bằng who, which, that, whose, where và nhận diện mệnh đề xác định.',
 '["Chọn relative pronoun theo antecedent và chức năng","Phân biệt defining và non-defining","Tránh câu có hai chủ ngữ thừa"]'::jsonb,

 '["Who dùng cho người; which cho vật; that thường dùng trong defining clause","Whose diễn tả sở hữu","Non-defining clause dùng dấu phẩy và không dùng that","Đại từ quan hệ làm tân ngữ có thể lược trong defining clause"]'::jsonb,
 '["Chọn where khi chỗ trống làm chủ ngữ","Dùng that sau dấu phẩy","Giữ thêm he/it sau relative pronoun làm chủ ngữ"]'::jsonb,
 '[{"sentence":"Applicants who meet the requirements will be contacted.","focus":"who làm chủ ngữ"},{"sentence":"The new branch, which opened in May, employs 40 people.","focus":"non-defining clause"}]'::jsonb,
 'Tuyển dụng và cơ sở',45),
('B',9,'B9','Liên từ kết hợp và phụ thuộc','Coordinating and subordinating conjunctions','Grammar','grammar.conjunctions',
 'Liên kết mệnh đề theo quan hệ bổ sung, đối lập, nguyên nhân, thời gian và điều kiện.',
 '["Phân biệt conjunction với preposition và transition","Chọn quan hệ logic","Kiểm tra hai phía của conjunction có đủ mệnh đề hay không"]'::jsonb,
 '["And, but, or, so nối thành phần ngang hàng","Because, although, while, if mở mệnh đề phụ","Because + clause; because of + noun phrase","Dấu câu phụ thuộc vị trí mệnh đề"]'::jsonb,
 '["Dùng because of trước mệnh đề","Dùng although và but trong cùng cấu trúc","Chọn liên từ theo nghĩa từ đơn mà bỏ logic đoạn"]'::jsonb,
 '[{"sentence":"Although demand increased, production remained stable.","focus":"although + clause"},{"sentence":"The event was postponed because of heavy rain.","focus":"because of + noun phrase"}]'::jsonb,

 'Báo cáo và họp hành',45),
('B',10,'B10','Giới từ thời gian và nơi chốn','Prepositions of time and place','Grammar','grammar.prepositions_time_place',
 'Dùng at, on, in, by, until, during và giới từ vị trí theo ngữ cảnh lịch và địa điểm.',
 '["Phân biệt by với until","Dùng during với danh từ và while với mệnh đề","Chọn in/on/at theo mức độ cụ thể"]'::jsonb,
 '["At dùng cho điểm thời gian/địa điểm cụ thể; on cho ngày/bề mặt; in cho khoảng hoặc không gian rộng","By là không muộn hơn; until là kéo dài đến","During + noun phrase; while + clause","Arrive at/in nhưng reach không cần giới từ"]'::jsonb,
 '["Nhầm by Friday với until Friday","Dùng during the team met","Dịch máy móc giới từ từ tiếng Việt"]'::jsonb,
 '[{"sentence":"Please submit the form by 5 p.m. on Thursday.","focus":"deadline và ngày"},{"sentence":"The lobby will remain closed until noon.","focus":"trạng thái kéo dài đến mốc"}]'::jsonb,

 'Lịch họp và địa điểm',40)
)
insert into learning.knowledge_topics
    (id, course_version_id, level_id, code, title_vi, title_en, category,
     primary_tag, summary, learning_objectives, core_knowledge, common_traps,
     worked_examples, vocabulary_theme, estimated_minutes, sequence, state)
select gen_random_uuid(), cv.id, cl.id, d.code, d.title_vi, d.title_en, d.category,

       d.primary_tag, d.summary, d.objectives, d.core, d.traps, d.examples,
       d.vocabulary_theme, d.minutes, d.sequence, 'Published'
from topic_data d
join learning.course_versions cv on cv.id = '60000000-0000-4000-8000-000000000001'
join learning.curriculum_levels cl on cl.course_version_id = cv.id and cl.code = d.level_code;

with topic_data(level_code, sequence, code, title_vi, title_en, category, primary_tag,
    summary, objectives, core, traps, examples, vocabulary_theme, minutes) as (values
('C',1,'C1','Điều kiện loại 3 và hỗn hợp','Third and mixed conditionals','Grammar','grammar.conditionals_advanced',
 'Diễn đạt giả định trái quá khứ và kết quả nối giữa quá khứ với hiện tại.',
 '["Tạo third conditional đúng","Phân biệt mixed past-to-present và present-to-past","Suy ra mốc thời gian ở cả hai mệnh đề"]'::jsonb,
 '["Third: if + had V3, would have V3","Mixed past-to-present: điều kiện quá khứ tạo kết quả hiện tại","Mixed present-to-past: trạng thái hiện tại giả định giải thích kết quả quá khứ","Could/might thay would để đổi sắc thái"]'::jsonb,
 '["Dùng would trong if-clause thông thường","Trộn thời gian mà không có quan hệ nghĩa","Nhầm had V3 với past simple"]'::jsonb,
 '[{"sentence":"If the supplier had warned us, we would have adjusted the schedule.","focus":"giả định trái quá khứ"},{"sentence":"If we had upgraded earlier, the system would be faster now.","focus":"quá khứ dẫn tới kết quả hiện tại"}]'::jsonb,
 'Rủi ro và phương án dự phòng',50),
('C',2,'C2','Bị động nâng cao và cấu trúc sai khiến','Advanced passive and causative','Grammar','grammar.passive_advanced',
 'Dùng reporting passive, have/get something done và bị động với hai tân ngữ.',
 '["Biến đổi reporting structure","Phân biệt tự làm với thuê/nhờ làm","Giữ đúng thì trong passive infinitive"]'::jsonb,
 '["It is reported that... và subject + is reported to... cùng chuyển trọng tâm","Have/get + object + V3 diễn tả sắp xếp để việc được thực hiện","Động từ hai tân ngữ có thể có hai dạng bị động tùy trọng tâm","Perfect passive infinitive: to have been V3"]'::jsonb,
 '["Hiểu have something done là chủ ngữ tự làm","Sai dạng to be/to have been theo thời gian","Đổi bị động cho nội động từ"]'::jsonb,
 '[{"sentence":"The company is expected to announce the results tomorrow.","focus":"reporting passive"},{"sentence":"We had the air-conditioning system inspected.","focus":"causative"}]'::jsonb,
 'Bảo trì và thông cáo',50),
('C',3,'C3','Đảo ngữ với trạng từ hạn định','Inversion','Grammar','grammar.inversion',
 'Nhận diện và tạo đảo trợ động từ sau trạng từ phủ định/hạn định trong văn phong trang trọng.',
 '["Nhận diện trigger đảo ngữ","Chọn trợ động từ theo thì","Phân biệt đảo ngữ với trật tự câu hỏi"]'::jsonb,
 '["Never, rarely, seldom, hardly, only after ở đầu câu thường kéo theo auxiliary + subject","Not only...but also có thể đảo ở mệnh đề đầu","No sooner...than và hardly...when dùng quan hệ thời gian cố định","Động từ be đảo trực tiếp với chủ ngữ"]'::jsonb,
 '["Đảo cả hai mệnh đề","Quên thêm do/does/did","Nhầm hardly với hard"]'::jsonb,
 '[{"sentence":"Rarely do customers request a printed receipt.","focus":"do-support sau rarely"},{"sentence":"Only after the review did the board approve the plan.","focus":"đảo ở mệnh đề chính"}]'::jsonb,
 'Văn bản trang trọng',50),
('C',4,'C4','Cấu trúc song song','Parallel structure','Grammar','grammar.parallelism',
 'Giữ cùng hình thức ngữ pháp trong danh sách, cặp liên từ và so sánh.',
 '["Kiểm tra các phần được nối có cùng dạng","Sửa faulty parallelism","Đặt thành phần chung ngoài chuỗi khi cần"]'::jsonb,
 '["And/or/but nối các đơn vị ngang chức năng","Both...and, either...or, not only...but also cần cấu trúc cân xứng","Danh sách có thể song song bằng noun phrase, V-ing hoặc infinitive","So sánh phải cùng phạm vi logic"]'::jsonb,
 '["Trộn to V với V-ing trong một danh sách","Đặt not only sai vị trí làm lệch cấu trúc","Chỉ nhìn từ gần conjunction"]'::jsonb,
 '[{"sentence":"The role involves planning campaigns, analyzing data, and reporting results.","focus":"ba V-ing song song"},{"sentence":"The policy is both practical and affordable.","focus":"hai tính từ song song"}]'::jsonb,
 'Marketing và vận hành',45),
('C',5,'C5','Mệnh đề danh từ','Noun clauses','Grammar','grammar.noun_clauses',
 'Dùng that, whether/if và wh-word để tạo mệnh đề làm chủ ngữ, tân ngữ hoặc bổ ngữ.',
 '["Nhận diện chức năng danh từ của cả mệnh đề","Giữ trật tự câu kể trong embedded question","Chọn whether khi có or not hoặc sau giới từ"]'::jsonb,
 '["Noun clause dùng trật tự subject + verb, không đảo như câu hỏi","That có thể lược khi làm tân ngữ trong ngữ cảnh phù hợp","Whether dùng linh hoạt hơn if trong văn phong chính thức","What đã mang nghĩa the thing that và không cần antecedent"]'::jsonb,
 '["Đảo trợ động từ trong embedded question","Dùng that khi chỗ trống cần what","Dùng if sau giới từ"]'::jsonb,
 '[{"sentence":"Please confirm whether the venue is available.","focus":"trật tự câu kể"},{"sentence":"What the client needs is a revised timeline.","focus":"what-clause làm chủ ngữ"}]'::jsonb,
 'Yêu cầu và xác nhận',45),
('C',6,'C6','Cụm phân từ và mệnh đề rút gọn','Participle clauses','Grammar','grammar.participle_clauses',
 'Rút gọn mệnh đề trạng ngữ/quan hệ khi chủ thể rõ và chọn V-ing hay V3 theo nghĩa chủ động/bị động.',
 '["Xác định quan hệ chủ động hoặc bị động","Kiểm tra chủ thể ngầm không bị dangling","Khôi phục mệnh đề đầy đủ để kiểm nghĩa"]'::jsonb,
 '["V-ing thường mang nghĩa chủ động hoặc đồng thời","V3 thường mang nghĩa bị động/hoàn tất","Having V3 nhấn mạnh hành động hoàn tất trước","Chủ thể ngầm của participle clause phải khớp chủ ngữ mệnh đề chính"]'::jsonb,
 '["Dangling participle","Chọn V-ing chỉ vì danh từ là người","Rút gọn mệnh đề khi hai chủ thể khác nhau"]'::jsonb,
 '[{"sentence":"After reviewing the contract, the lawyer suggested two changes.","focus":"lawyer là chủ thể của reviewing"},{"sentence":"Located near the station, the hotel is convenient for visitors.","focus":"hotel nhận hành động locate"}]'::jsonb,
 'Hợp đồng và địa điểm',50),
('C',7,'C7','Liên từ tương quan','Correlative conjunctions','Grammar','grammar.correlative_conjunctions',
 'Dùng both...and, either...or, neither...nor và not only...but also với cấu trúc cân xứng và hòa hợp.',
 '["Giữ parallelism","Áp dụng proximity agreement khi policy dùng","Đặt cặp liên từ sát thành phần được nối"]'::jsonb,
 '["Hai vế của cặp liên từ phải cùng chức năng","Với either/or và neither/nor, động từ thường hòa hợp với chủ ngữ gần nhất trong cách dùng chuẩn phổ biến","Both...and thường tạo chủ ngữ số nhiều","Not only ở đầu câu có thể gây đảo ngữ"]'::jsonb,
 '["Nối một danh từ với một mệnh đề","Hòa hợp theo chủ ngữ xa hơn","Dùng both với or"]'::jsonb,
 '[{"sentence":"Neither the manager nor the assistants are available.","focus":"hòa hợp với assistants"},{"sentence":"The update will both reduce costs and improve reliability.","focus":"hai verb phrases song song"}]'::jsonb,
 'Phối hợp phòng ban',45),
('C',8,'C8','Câu giả định trong đề xuất và yêu cầu','Mandative subjunctive','Grammar','grammar.subjunctive',
 'Dùng dạng nguyên mẫu sau động từ/tính từ yêu cầu, đề xuất và tính cấp thiết trong tiếng Anh-Mỹ kinh doanh.',
 '["Nhận diện trigger suggest, require, essential","Dùng base form không chia","Phân biệt suggest + V-ing với suggest that + clause"]'::jsonb,
 '["Suggest/recommend/require that + subject + base verb","Be giữ nguyên be trong subjunctive","It is essential/important that... có thể dùng subjunctive","Biến thể should + base verb phổ biến trong Anh-Anh"]'::jsonb,
 '["Chia động từ theo chủ ngữ sau that","Dùng to-infinitive trực tiếp sau suggest","Nhầm suggest nghĩa ám chỉ với đề xuất"]'::jsonb,
 '[{"sentence":"The policy requires that every request be documented.","focus":"be không chia"},{"sentence":"We recommend that she review the figures again.","focus":"review dạng nguyên mẫu"}]'::jsonb,
 'Pháp lý và quy định',45),
('C',9,'C9','Cấu trúc nhấn mạnh','Emphasis structures','Grammar','grammar.emphasis',
 'Hiểu cleft sentence, do-emphasis và vị trí trạng từ nhấn mạnh trong văn bản công việc.',
 '["Nhận diện it-cleft và what-cleft","Dùng do/does/did để nhấn mạnh động từ","Không nhầm cấu trúc nhấn mạnh với câu hỏi"]'::jsonb,
 '["It is/was X that/who... nhấn mạnh một thành phần","What-clause + be nhấn mạnh thông tin mới","Do/does/did + base verb nhấn mạnh khẳng định","Even, particularly, especially cần đứng gần phần được nhấn mạnh"]'::jsonb,
 '["Dùng do-emphasis với động từ be","Sai hòa hợp quanh cleft","Đặt only làm thay đổi nghĩa ngoài ý muốn"]'::jsonb,
 '[{"sentence":"What we need is a more reliable supplier.","focus":"what-cleft"},{"sentence":"The figures do show a steady improvement.","focus":"do-emphasis"}]'::jsonb,
 'Thuyết trình và báo cáo',40),
('C',10,'C10','So sánh nâng cao','Advanced comparisons','Grammar','grammar.comparison_advanced',
 'Dùng double comparative, proportional comparison và cấu trúc so sánh số liệu chính xác.',
 '["Diễn đạt mức thay đổi","Dùng the more...the more","Phân biệt số lần với phần trăm cao hơn"]'::jsonb,
 '["The + comparative..., the + comparative... diễn tả quan hệ tỷ lệ","More and more hoặc increasingly diễn tả xu hướng","Twice as much/many as khác twice more than về độ rõ nghĩa","No less than và not less than khác sắc thái"]'::jsonb,
 '["So sánh hai mẫu số khác nhau","Dùng much với danh từ đếm được","Nhầm fewer và lower trong số liệu"]'::jsonb,
 '[{"sentence":"The sooner we receive approval, the earlier production can begin.","focus":"proportional comparative"},{"sentence":"Online sales were twice as high as last year.","focus":"so sánh tỷ lệ rõ ràng"}]'::jsonb,
 'Tài chính và số liệu',45)
)
insert into learning.knowledge_topics
    (id, course_version_id, level_id, code, title_vi, title_en, category,
     primary_tag, summary, learning_objectives, core_knowledge, common_traps,
     worked_examples, vocabulary_theme, estimated_minutes, sequence, state)
select gen_random_uuid(), cv.id, cl.id, d.code, d.title_vi, d.title_en, d.category,
       d.primary_tag, d.summary, d.objectives, d.core, d.traps, d.examples,
       d.vocabulary_theme, d.minutes, d.sequence, 'Published'
from topic_data d
join learning.course_versions cv on cv.id = '60000000-0000-4000-8000-000000000001'
join learning.curriculum_levels cl on cl.course_version_id = cv.id and cl.code = d.level_code;

with topic_data(level_code, sequence, code, title_vi, title_en, category, primary_tag,
    summary, objectives, core, traps, examples, vocabulary_theme, minutes) as (values
('D',1,'D1','Phân biệt từ loại nâng cao','Advanced word forms','Grammar','grammar.word_form_advanced',
 'Phân tích word family, nghĩa của affix và collocation để chọn dạng từ trong câu khó.',
 '["Xây word family theo gốc","Phân biệt noun người/vật/khái niệm","Dùng collocation để giải quyết nhiều dạng cùng đúng ngữ pháp"]'::jsonb,
 '["Suffix gợi ý từ loại nhưng không quyết định hoàn toàn nghĩa","Danh từ trừu tượng, người và quy trình có hậu tố khác nhau","Negative prefix phải khớp nghĩa chứ không chỉ hình thức","Sau linking verb có thể cần adjective, không mặc định adverb"]'::jsonb,
 '["Chọn economic/economical chỉ theo từ loại","Nhầm respectful/respective","Chọn danh từ đúng vị trí nhưng sai collocation"]'::jsonb,
 '[{"sentence":"The new process has significantly improved operational efficiency.","focus":"operational bổ nghĩa efficiency"},{"sentence":"Please contact the designated representative.","focus":"representative là người đại diện"}]'::jsonb,
 'Kinh tế và vận hành',55),
('D',2,'D2','Giới từ cố định và collocation','Dependent prepositions and collocations','Vocabulary','vocabulary.collocations',
 'Học cụm động từ–giới từ, tính từ–giới từ và noun collocation theo ngữ cảnh thay vì danh sách rời.',
 '["Nhận diện dependent preposition","Lưu collocation theo cụm và ví dụ","Phân biệt cụm gần nghĩa nhưng khác register"]'::jsonb,
 '["Comply with, responsible for, contribute to là đơn vị từ vựng","Make a decision nhưng reach an agreement","Giới từ trong collocation ít suy ra trực tiếp từ tiếng Việt","Ôn bằng retrieval và spaced repetition hiệu quả hơn đọc lại"]'::jsonb,
 '["Dịch từng từ để chọn giới từ","Học một từ không kèm complement","Nhầm rise in với increase by khi đọc số liệu"]'::jsonb,
 '[{"sentence":"All contractors must comply with the safety regulations.","focus":"comply with"},{"sentence":"The parties reached an agreement on delivery terms.","focus":"reach an agreement on"}]'::jsonb,
 'Collocation công việc',55),
('D',3,'D3','Văn phong trang trọng trong kinh doanh','Formal business register','ExamStrategy','strategy.business_register',
 'Chọn từ và cấu trúc phù hợp email, thông báo, báo cáo và hợp đồng mà không làm câu tối nghĩa.',
 '["Phân biệt neutral, formal và conversational register","Nhận diện từ nối và động từ trang trọng","Tránh nominalization quá mức"]'::jsonb,
 '["Formal register ưu tiên diễn đạt chính xác và lịch sự","Request, inform, regarding thường trang trọng hơn ask, tell, about nhưng không luôn thay thế trực tiếp","Contraction thường ít xuất hiện trong tài liệu chính thức","Câu ngắn rõ vẫn tốt hơn chuỗi danh từ khó đọc"]'::jsonb,
 '["Chọn từ dài nhất vì tưởng trang trọng","Dùng hereby trong email thông thường","Thay từ đồng nghĩa nhưng làm đổi valency"]'::jsonb,
 '[{"sentence":"Please be advised that the office will close at 3 p.m.","focus":"thông báo trang trọng"},{"sentence":"We are writing regarding your recent inquiry.","focus":"regarding phù hợp register"}]'::jsonb,
 'Email, thông báo và hợp đồng',50),
('D',4,'D4','Rút gọn mệnh đề quan hệ và trạng ngữ','Reduced clauses','Grammar','grammar.reduced_clauses',
 'Rút gọn có kiểm soát để hiểu noun phrase dài trong Part 5/6 và tránh dangling modifier.',
 '["Khôi phục relative clause từ V-ing/V3/to V","Chọn dạng theo voice và thời","Kiểm tra chủ thể của adverbial reduction"]'::jsonb,
 '["Active relative clause thường rút thành V-ing; passive thành V3","To-infinitive có thể diễn tả nhiệm vụ/thứ tự hoặc mục đích","Adverbial clause chỉ rút khi hai mệnh đề cùng chủ thể","Being thường có thể lược trong passive reduction"]'::jsonb,
 '["Rút gọn khi relative pronoun là tân ngữ nhưng giữ sai động từ","Dangling modifier","Nhầm V3 tính từ với động từ chính"]'::jsonb,
 '[{"sentence":"Employees working remotely must update their availability.","focus":"who work → working"},{"sentence":"Documents submitted after the deadline will be reviewed later.","focus":"that are submitted → submitted"}]'::jsonb,
 'Chính sách và tài liệu',55),
('D',5,'D5','So...that và such...that','Result structures','Grammar','grammar.result_structures',
 'Chọn cấu trúc kết quả theo adjective/adverb hoặc noun phrase và xử lý đảo ngữ hiếm gặp.',
 '["Phân biệt so với such","Dùng lượng từ trong cấu trúc kết quả","Đọc quan hệ nguyên nhân–kết quả"]'::jsonb,
 '["So + adjective/adverb + that","Such + (a/an) + adjective + noun + that","So many/few + count noun; so much/little + noncount noun","So ở đầu câu trong văn phong rất trang trọng có thể gây đảo nhưng không phải trọng tâm sản xuất"]'::jsonb,
 '["Dùng such trước adjective không có noun","Nhầm so much với such much","Bỏ a/an trước danh từ đếm được số ít"]'::jsonb,
 '[{"sentence":"Demand was so high that the item sold out.","focus":"so + adjective"},{"sentence":"It was such a useful workshop that we scheduled another one.","focus":"such + a + adjective + noun"}]'::jsonb,
 'Nhu cầu và sự kiện',40),
('D',6,'D6','Despite, although và các cấu trúc nhượng bộ','Concession structures','Grammar','grammar.concession',
 'Chọn connector theo sau bởi noun phrase hay clause và giữ logic đối lập trong đoạn.',
 '["Phân biệt despite/in spite of với although/even though","Dùng despite the fact that khi cần clause","Nhận diện nevertheless như transition"]'::jsonb,
 '["Despite/in spite of + noun hoặc V-ing","Although/even though + clause","Despite the fact that + clause đúng nhưng dài","Nevertheless/however nối ý ở cấp câu và cần dấu câu phù hợp"]'::jsonb,
 '["Dùng despite of","Dùng although + noun phrase","Ghép although và nevertheless trong cùng một quan hệ không cần thiết"]'::jsonb,
 '[{"sentence":"Despite the delay, the project stayed within budget.","focus":"despite + noun"},{"sentence":"Although the project was delayed, it stayed within budget.","focus":"although + clause"}]'::jsonb,
 'Đàm phán và tiến độ',40),
('D',7,'D7','Câu hỏi gián tiếp và tường thuật nâng cao','Indirect questions and reporting','Grammar','grammar.indirect_reporting',
 'Tường thuật câu hỏi/yêu cầu với backshift, reporting verb và register phù hợp.',
 '["Giữ trật tự câu kể trong indirect question","Chọn reporting verb và complement","Áp dụng backshift khi mốc nhìn thay đổi"]'::jsonb,
 '["Could you tell me + wh-clause dùng trật tự subject + verb","Ask whether/if cho yes-no question","Advise, remind, warn, assure có pattern tân ngữ khác nhau","Backshift không bắt buộc khi sự thật vẫn đúng và ngữ cảnh hiện tại rõ"]'::jsonb,
 '["Dùng do/does trong indirect question","Dùng explain me","Backshift máy móc làm sai thông tin còn hiệu lực"]'::jsonb,
 '[{"sentence":"The client asked when the revised contract would be ready.","focus":"trật tự câu kể và backshift"},{"sentence":"Please remind staff to submit their timesheets.","focus":"remind + object + to V"}]'::jsonb,
 'Trao đổi với khách hàng',50),
('D',8,'D8','Nhận diện bẫy Part 5/6','Part 5 and 6 trap analysis','ExamStrategy','strategy.part5_6_traps',
 'Áp dụng quy trình đọc cấu trúc trước, nghĩa sau và kiểm tra discourse khi nhiều đáp án có vẻ đúng.',
 '["Phân loại câu hỏi trong 5–10 giây đầu","Loại đáp án sai cấu trúc trước khi dịch","Kiểm tra liên kết câu với Part 6"]'::jsonb,
 '["Word-form: nhìn vị trí và head word","Verb-form: tìm subject, time marker và voice","Connector: xác định hai phía là clause hay phrase","Vocabulary: kiểm collocation và register","Part 6: đọc ít nhất câu trước/sau khi chọn transition"]'::jsonb,
 '["Chọn theo từ quen mắt","Dịch toàn câu trước khi xác định loại câu","Dùng một mẹo cho mọi câu","Đổi đáp án đúng chỉ vì câu dài"]'::jsonb,
 '[{"sentence":"Before choosing a connector, mark whether each side is a clause or a noun phrase.","focus":"quy trình tránh bẫy"},{"sentence":"For a word-form blank, identify the head noun before reading every option.","focus":"ưu tiên cấu trúc"}]'::jsonb,
 'Bẫy thường gặp trong đề',60),
('D',9,'D9','Liên từ chuyển tiếp trong Part 6','Transitions and discourse','ReadingStrategy','reading.transitions',
 'Chọn transition theo quan hệ giữa câu/đoạn: bổ sung, đối lập, nguyên nhân, kết quả, ví dụ và trình tự.',
 '["Xác định quan hệ discourse trước khi nhìn đáp án","Phân biệt conjunction với conjunctive adverb","Dùng dấu câu như tín hiệu phụ"]'::jsonb,
 '["However/nevertheless diễn tả đối lập; therefore/consequently diễn tả kết quả","Moreover/furthermore bổ sung cùng hướng","For example minh họa; otherwise nêu hệ quả nếu không","Transition phải khớp cả câu trước và sau, không chỉ câu chứa chỗ trống"]'::jsonb,
 '["Chọn therefore chỉ vì có kết quả nhưng quan hệ thực là ví dụ","Bỏ qua dấu chấm/phẩy","Dùng moreover cho ý trái chiều"]'::jsonb,
 '[{"sentence":"The venue is centrally located. Moreover, it can accommodate 500 guests.","focus":"bổ sung cùng hướng"},{"sentence":"The first supplier offered a lower price. However, its delivery time was longer.","focus":"đối lập"}]'::jsonb,
 'Đoạn thông báo và email',55),
('D',10,'D10','Đảo ngữ trong câu điều kiện','Conditional inversion','Grammar','grammar.conditional_inversion',
 'Hiểu had/should/were inversion trong điều kiện trang trọng và chuyển đổi về if-clause.',
 '["Nhận diện ba mẫu đảo điều kiện","Khôi phục nghĩa và thời gian","Không nhầm should inversion với nghĩa vụ"]'::jsonb,
 '["Had + subject + V3 = if subject had V3","Should + subject + V = if subject should/happens to V","Were + subject + complement/to V = if subject were","Dạng đảo trang trọng hơn nhưng nghĩa điều kiện giữ nguyên"]'::jsonb,
 '["Dùng did thay had trong third conditional inversion","Hiểu should là bắt buộc","Đảo với mọi conditional"]'::jsonb,
 '[{"sentence":"Had we known about the closure, we would have chosen another route.","focus":"third conditional inversion"},{"sentence":"Should you need assistance, contact reception.","focus":"khả năng tương lai trang trọng"}]'::jsonb,
 'Điều khoản và thông báo',50),
('D',11,'D11','Cấu trúc nén thông tin và nominalization','Information-dense structures','Grammar','grammar.information_compression',
 'Phân tích noun phrase dài, apposition và nominalization để đọc chính xác mà vẫn ưu tiên văn phong rõ.',
 '["Tìm head noun trong noun phrase dài","Tách premodifier và postmodifier","Chuyển nominalization về động từ để kiểm nghĩa"]'::jsonb,
 '["Đọc noun phrase từ head noun rồi gắn modifier","Noun adjunct thường ở số ít nhưng có ngoại lệ lexical","Apposition đổi tên/giải thích danh từ trước","Nominalization phổ biến trong báo cáo nhưng lạm dụng làm câu khó hiểu"]'::jsonb,
 '["Coi mọi danh từ trước head noun là tính từ","Chọn sai head noun nên sai hòa hợp","Ưu tiên câu nén dù mất rõ nghĩa"]'::jsonb,
 '[{"sentence":"The quarterly customer satisfaction survey results were released today.","focus":"results là head noun"},{"sentence":"The committee approved the expansion of the regional distribution network.","focus":"chuỗi postmodifier bằng of-phrases"}]'::jsonb,
 'Báo cáo và phân tích',60)
)
insert into learning.knowledge_topics
    (id, course_version_id, level_id, code, title_vi, title_en, category,
     primary_tag, summary, learning_objectives, core_knowledge, common_traps,
     worked_examples, vocabulary_theme, estimated_minutes, sequence, state)
select gen_random_uuid(), cv.id, cl.id, d.code, d.title_vi, d.title_en, d.category,
       d.primary_tag, d.summary, d.objectives, d.core, d.traps, d.examples,
       d.vocabulary_theme, d.minutes, d.sequence, 'Published'
from topic_data d
join learning.course_versions cv on cv.id = '60000000-0000-4000-8000-000000000001'
join learning.curriculum_levels cl on cl.course_version_id = cv.id and cl.code = d.level_code;

with guide_data(code, formulas, steps, extensions, checks) as (values
('A1','["Determiner + (adverb) + adjective + noun","Subject + adverb + action verb","Subject + linking verb + adjective","Verb + object noun"]'::jsonb,
 '["Khoanh vùng từ đứng trước và sau chỗ trống","Xác định chỗ trống đang bổ nghĩa cho từ nào hoặc làm thành phần gì","Loại đáp án sai từ loại rồi mới kiểm nghĩa và collocation","Đọc lại cả câu để kiểm tra hòa hợp và sắc thái"]'::jsonb,
 '["Một số từ đuôi -ly là tính từ: friendly, costly, timely","Một gốc có thể có nhiều danh từ khác nghĩa: applicant, application, applicability","Linking verbs như remain, become, seem thường theo sau bởi adjective"]'::jsonb,
 '["Trong cụm a ___ proposal, cần từ loại nào?","Sau increased ___, cần adjective hay adverb?","Vì sao friendly không phải trạng từ?"]'::jsonb),
('A2','["S + V","S + V + O","S + linking V + complement","There + be + noun phrase","It + be + adjective + to V/that-clause"]'::jsonb,
 '["Tìm mọi động từ hữu hạn","Tìm chủ ngữ thật và bỏ qua noun trong prepositional phrase","Kiểm tra động từ có cần object/complement không","Xác định phần còn thiếu rồi chọn đáp án"]'::jsonb,
 '["Cụm giới từ có thể chen giữa subject và verb","Mệnh đề quan hệ có động từ riêng nhưng không thay động từ chính","It và there có thể là chủ ngữ hình thức"]'::jsonb,
 '["Trong The list of items ___ ready, chủ ngữ là gì?","Câu có hai động từ hữu hạn cần connector hay dạng rút gọn?","Phân biệt object với subject complement"]'::jsonb),
('A3','["Present simple: S + V(s/es)","Present continuous: S + am/is/are + V-ing","Time clause for schedules: when/once + present simple"]'::jsonb,
 '["Tìm time marker và xem thời gian là thường lệ hay tạm thời","Kiểm tra verb có phải stative verb không","Chọn thì rồi kiểm subject-verb agreement","Đọc nghĩa toàn câu để phân biệt lịch với hành động đang xảy ra"]'::jsonb,
 '["Present continuous có thể nói thay đổi dần: Sales are increasing","Always + continuous có thể thể hiện sự khó chịu","Lịch tàu, lịch họp chính thức thường dùng present simple"]'::jsonb,
 '["Every Monday gợi ý thì nào?","This week luôn bắt buộc continuous không?","Vì sao belong thường không dùng V-ing?"]'::jsonb),
('A4','["Past simple: S + V2/ed","Past continuous: S + was/were + V-ing","While + past continuous, past simple","When + past simple, past continuous"]'::jsonb,
 '["Đánh dấu mốc thời gian đã kết thúc","Xác định hành động nền và sự kiện xen vào","Kiểm dạng bất quy tắc và auxiliary did","Không dùng past perfect nếu câu chỉ có một mốc quá khứ đơn giản"]'::jsonb,
 '["Hai hành động song song kéo dài có thể cùng past continuous","When không tự động quyết định thì; quan hệ sự kiện mới quyết định","Used to diễn tả thói quen quá khứ không còn tiếp diễn"]'::jsonb,
 '["Yesterday có dùng present perfect không?","Trong khi họ đang họp thì chuông reo: động từ nào continuous?","Sau did dùng V1 hay V2?"]'::jsonb),
('A5','["will + V","be going to + V","am/is/are + V-ing + future time","Present simple for fixed timetable","when/once/until + present simple, main clause + will"]'::jsonb,
 '["Xác định đó là quyết định tức thời, ý định, sắp xếp hay lịch cố định","Tách main clause và time clause","Chọn form rồi kiểm mốc thời gian","Đọc lại để tránh dùng hai dấu hiệu tương lai trong time clause"]'::jsonb,
 '["Future continuous dùng cho hoạt động đang diễn ra tại một mốc tương lai","Be about to diễn tả sắp xảy ra ngay","Shall còn gặp trong đề nghị trang trọng nhưng ít dùng trong giao tiếp Mỹ"]'::jsonb,
 '["Sau once trong mệnh đề thời gian dùng will không?","Cuộc họp đã đặt lịch với đối tác dùng form nào?","Dự đoán dựa trên bằng chứng hiện tại phù hợp form nào?"]'::jsonb),
('A6','["many/few/fewer + plural count noun","much/little/less + noncount noun","a number of + plural noun + plural verb","the amount of + noncount noun + singular verb"]'::jsonb,
 '["Xác định nghĩa cụ thể của noun trong câu","Kiểm noun có đếm được ở nghĩa đó không","Chọn quantifier và dạng số","Kiểm lại subject-verb agreement"]'::jsonb,
 '["Experience có thể là kinh nghiệm không đếm được hoặc trải nghiệm đếm được","Paper có thể là vật liệu hoặc tài liệu/bài báo","Data thường được dùng như mass noun trong business English hiện đại nhưng policy biên tập phải nhất quán"]'::jsonb,
 '["Advice có dạng số nhiều không?","Fewer hay less applicants?","A number of đi với is hay are?"]'::jsonb),
('A7','["a/an + singular count noun","the + identifiable noun","zero article + plural/noncount noun in general meaning","the + superlative/ordinal"]'::jsonb,
 '["Kiểm noun có đếm được và số ít không","Hỏi người đọc đã xác định được đối tượng chưa","Nếu dùng a/an, nghe âm đầu của từ kế tiếp","Kiểm các cụm cố định và tên riêng"]'::jsonb,
 '["An MBA nhưng a university do âm đầu","The có thể chỉ một nhóm bằng adjective: the unemployed","Tên công ty thường không có the trừ khi tên chính thức chứa nó"]'::jsonb,
 '["An European office đúng hay sai?","Lần đầu nhắc một report dùng article nào?","Nói equipment nói chung có cần article không?"]'::jsonb),
('A8','["Subject pronoun + V","V/preposition + object pronoun","possessive determiner + noun","possessive pronoun stands alone","subject + V + reflexive pronoun"]'::jsonb,
 '["Xác định chỗ trống làm subject, object hay determiner","Tìm antecedent và số/ngôi","Kiểm đại từ phản thân có cùng người/vật với subject không","Loại dạng sở hữu không phù hợp cấu trúc"]'::jsonb,
 '["One/ones thay noun đã nhắc để tránh lặp","They/them có thể dùng số ít khi giới tính không xác định theo style guide","Its là sở hữu; it is/it has viết tắt là it’s nhưng đề chuẩn thường tránh gây nhập nhằng"]'::jsonb,
 '["Sau between dùng we hay us?","This report is our hay ours?","Khi nào himself là object thật, khi nào chỉ nhấn mạnh?"]'::jsonb),
('A9','["short adjective + -er/-est","more/most + long adjective","as + adjective/adverb + as","less + adjective + than","much/far/slightly + comparative"]'::jsonb,
 '["Xác định có hai hay từ ba đối tượng trở lên","Kiểm adjective irregular","Kiểm hai vế có cùng loại đối tượng","Chọn modifier thể hiện đúng mức chênh lệch"]'::jsonb,
 '["The same as và different from là cấu trúc so sánh hữu ích","Comparative and comparative diễn tả xu hướng","One/ones giúp tránh so sánh sai đối tượng"]'::jsonb,
 '["More better sai ở đâu?","So sánh salary của hai phòng ban cần lặp noun thế nào?","Slightly có bổ nghĩa superlative không?"]'::jsonb),
('B1','["have/has + V3","have/has been + V-ing","since + starting point","for + duration","past simple + finished time"]'::jsonb,
 '["Khoanh time expression","Hỏi khoảng thời gian còn nối với hiện tại không","Chọn simple hay continuous theo kết quả hoặc quá trình","Kiểm V3 và have/has"]'::jsonb,
 '["Present perfect continuous nhấn mạnh thời lượng/quá trình và thường không dùng với stative verbs","This morning có thể là finished hoặc unfinished tùy thời điểm nói","Have been to khác have gone to"]'::jsonb,
 '["Last month dùng present perfect được không?","Since three years đúng hay sai?","She has gone to Seoul cho biết cô ấy đã về chưa?"]'::jsonb),
('B2','["had + V3","By the time + past simple, subject + had V3","After + past perfect/past simple, past simple"]'::jsonb,
 '["Liệt kê các sự kiện quá khứ theo trục thời gian","Xác định sự kiện xảy ra trước","Chỉ dùng past perfect nơi cần làm rõ/nhấn mạnh","Kiểm V3 và tránh lặp had không cần thiết"]'::jsonb,
 '["Past perfect continuous nhấn mạnh quá trình trước mốc quá khứ","Trong câu có before/after rõ nghĩa, past simple đôi khi đủ","Reported speech có thể backshift past simple thành past perfect"]'::jsonb,
 '["Hai sự kiện quá khứ có luôn cần had không?","By the time đi với mốc nào?","Had had có thể đúng trong trường hợp nào?"]'::jsonb),
('B3','["will be + V-ing","will have + V3","will have been + V-ing","by + future deadline → often future perfect","at + future time → often future continuous"]'::jsonb,
 '["Xác định câu hỏi nhấn vào tiến trình hay hoàn tất","Tìm deadline với by hoặc mốc đang diễn ra với at","Chọn simple/continuous phù hợp verb","Kiểm form be/have và participle"]'::jsonb,
 '["Future perfect continuous nhấn mạnh duration đến mốc tương lai","Không phải mọi by đều yêu cầu future perfect nếu ngữ cảnh là mệnh lệnh","Trong lịch đơn giản, present simple có thể tự nhiên hơn future form"]'::jsonb,
 '["At this time tomorrow gợi ý form nào?","By Friday khác until Friday thế nào?","Stative verb có phù hợp future continuous không?"]'::jsonb),
('B4','["Active: S + V + O","Passive: O + be + V3 (+ by S)","Modal passive: modal + be + V3","Perfect passive: have/has been + V3"]'::jsonb,
 '["Tìm subject có thực hiện hay nhận hành động","Xác định thì từ context","Chia be theo thì rồi dùng V3","Chỉ giữ by-agent khi thông tin đó cần thiết"]'::jsonb,
 '["Get + V3 là bị động ít trang trọng và thường nhấn sự kiện","Một số verb hai object có hai passive patterns","Middle construction như This product sells well có hình thức chủ động nhưng nghĩa đặc biệt"]'::jsonb,
 '["Must submitted thiếu gì?","Happen có chuyển passive được không?","Khi nào by the team nên lược?"]'::jsonb),
('B5','["Zero: If + present, present","First: If + present, will/modal + V","Second: If + past, would/could/might + V","Unless + affirmative clause = if...not"]'::jsonb,
 '["Đánh giá điều kiện là quy luật, khả năng thật hay giả định","Chọn timeline cho if-clause và result clause","Kiểm phủ định với unless","Đổi về if-not để kiểm nghĩa"]'::jsonb,
 '["If có thể mang nghĩa whether trong noun clause và không theo conditional pattern","Were có thể dùng cho mọi ngôi trong giả định trang trọng","Imperative có thể làm result clause của first conditional"]'::jsonb,
 '["If it will rain tomorrow đúng trong conditional thường không?","Unless you do not... có lỗi gì?","If I were và If I was khác register thế nào?"]'::jsonb),
('B6','["modal + bare infinitive","modal + be + V3","must not = prohibition","do not have to = no necessity","should have + V3 = past expectation/regret"]'::jsonb,
 '["Xác định chức năng: nghĩa vụ, khả năng, lời khuyên hay suy đoán","Đánh giá mức chắc chắn và register","Chọn active/passive","Kiểm sau modal là bare infinitive"]'::jsonb,
 '["Must và have to khác nguồn nghĩa vụ trong một số ngữ cảnh","May well diễn tả khả năng khá cao","Cannot have + V3 suy đoán một việc quá khứ không thể xảy ra"]'::jsonb,
 '["Must not và need not khác nhau thế nào?","Sau should có to không?","May be delayed là cấu trúc gì?"]'::jsonb),
('B7','["verb + to V: decide, plan, agree","verb + V-ing: avoid, consider, finish","preposition + V-ing","verb + object + to V: ask, allow, remind","make/let + object + bare V"]'::jsonb,
 '["Xác định head verb hoặc preposition điều khiển complement","Kiểm có object chen giữa không","Xét trường hợp đổi form làm đổi nghĩa","Học cả cụm bằng ví dụ thay vì từ đơn"]'::jsonb,
 '["Remember to V là nhớ phải làm; remember V-ing là nhớ đã làm","Try to V là nỗ lực; try V-ing là thử phương án","Need V-ing có thể mang nghĩa need to be V3"]'::jsonb,
 '["Suggest to postpone đúng không?","Be used to work hay working?","Make employees to attend có lỗi gì?"]'::jsonb),
('B8','["person + who/that + V","thing + which/that + V","noun + whose + noun","place + where + clause","non-defining: noun, who/which...,"]'::jsonb,
 '["Tìm antecedent","Xác định chỗ trống làm subject, object, possessive hay adverb","Kiểm dấu phẩy để phân loại clause","Chọn pronoun rồi loại subject/object thừa"]'::jsonb,
 '["Whom còn gặp sau preposition trong formal English","Preposition có thể đứng cuối defining clause hoặc trước whom/which","What không có antecedent; which/who có antecedent"]'::jsonb,
 '["The office which we work thiếu gì?","Sau dấu phẩy dùng that được không?","Khi nào relative pronoun có thể lược?"]'::jsonb),
('B9','["because + clause / because of + noun phrase","although + clause / despite + noun phrase","coordinating conjunction joins parallel units","subordinator + dependent clause, main clause"]'::jsonb,
 '["Xác định hai phía là clause hay phrase","Xác định quan hệ logic","Chọn loại connector phù hợp cấu trúc","Kiểm dấu câu và tránh connector kép"]'::jsonb,
 '["For có thể là coordinating conjunction mang nghĩa because trong văn phong trang trọng","While có thể chỉ thời gian hoặc đối lập","So that diễn tả mục đích/kết quả và khác so...that"]'::jsonb,
 '["Because of sales declined sai ở đâu?","Although...but có cần cả hai không?","While trong câu đang mang nghĩa thời gian hay đối lập?"]'::jsonb),
('B10','["at + exact point","on + day/date/surface","in + period/area","by = no later than","until = continuing up to","during + noun / while + clause"]'::jsonb,
 '["Phân loại quan hệ thời gian hay không gian","Xác định point, surface hay enclosed/large area","Với deadline, kiểm hành động hoàn tất hay kéo dài","Kiểm collocation của verb"]'::jsonb,
 '["On time là đúng giờ; in time là kịp lúc","At the end khác in the end","Between dùng cho các mốc riêng; among dùng trong nhóm"]'::jsonb,
 '["Submit by Friday có được nộp sớm không?","Closed until Friday có nghĩa mở vào lúc nào?","During we met sai vì sao?"]'::jsonb)
)
insert into learning.topic_learning_guides
    (topic_id, formula_patterns, application_steps, extensions, self_check_prompts)
select kt.id, d.formulas, d.steps, d.extensions, d.checks
from guide_data d
join learning.knowledge_topics kt
  on kt.course_version_id = '60000000-0000-4000-8000-000000000001'
 and kt.code = d.code;

with guide_data(code, formulas, steps, extensions, checks) as (values
('C1','["Third: If + had V3, would/could/might have V3","Mixed past→present: If + had V3, would + V/be now","Mixed present→past: If + past/were, would have V3"]'::jsonb,
 '["Vẽ hai mốc: điều kiện và kết quả","Xác định mỗi mệnh đề trái quá khứ hay trái hiện tại","Chọn pattern khớp hai mốc","Kiểm V3 và modal perfect"]'::jsonb,
 '["But for/without + noun có thể thay if-clause","Otherwise có thể diễn tả kết quả nếu điều kiện không xảy ra","Inversion với had thuộc bài D10"]'::jsonb,
 '["If we had acted, we would be safe now là loại gì?","Would have đi ở mệnh đề nào?","But for the delay có thể viết lại ra sao?"]'::jsonb),
('C2','["It + be + reported + that-clause","Subject + be + reported + to V/to have V3","have/get + object + V3","give someone something → someone is given something"]'::jsonb,
 '["Xác định thông tin cần làm topic","Chọn reporting passive, causative hay passive thường","Đặt thì vào be/infinitive phù hợp timeline","Kiểm agent và object còn lại"]'::jsonb,
 '["Get causative thường ít trang trọng hơn have","Need + V-ing có thể mang nghĩa passive","Reporting verb khác nhau về mức chắc chắn: believe, expect, allege"]'::jsonb,
 '["Is believed to have left diễn tả thời gian nào?","Have the printer repair hay repaired?","Hai dạng passive của give khác trọng tâm ra sao?"]'::jsonb),
('C3','["Negative/restrictive adverb + auxiliary + S + V","Rarely do/does/did + S + V","Only after + phrase/clause + auxiliary + S + V","No sooner had + S + V3 + than..."]'::jsonb,
 '["Khoanh trigger ở đầu câu","Xác định thì của câu không đảo","Chọn auxiliary tương ứng","Đặt subject sau auxiliary nhưng giữ main verb đúng form"]'::jsonb,
 '["Not until mở đầu thì mệnh đề chính đảo, mệnh đề until không đảo","So/Such ở đầu câu có inversion trang trọng","Here comes... là locative inversion khác nhóm"]'::jsonb,
 '["Only after the meeting, the board did... sai ở đâu?","Rarely has the system failed đúng form không?","No sooner đi với than hay when?"]'::jsonb),
('C4','["X and Y must share grammatical form","both X and Y","either X or Y","not only X but also Y","to V, to V, and to V / V-ing, V-ing, and V-ing"]'::jsonb,
 '["Gạch chân conjunction hoặc dấu phẩy liệt kê","Đánh dấu form của từng thành phần","Đưa phần dùng chung ra trước chuỗi","Sửa tất cả phần về cùng chức năng và kiểm nghĩa"]'::jsonb,
 '["Parallelism áp dụng cả heading, bullet và table label","Có thể lược to ở các infinitive sau nếu style nhất quán","Ý song song không chỉ giống form mà còn phải cùng cấp logic"]'::jsonb,
 '["Planning, to execute, and monitoring sai thế nào?","Not only đặt trước noun thì but also phải nối gì?","Hai vế giống form nhưng khác cấp logic có đạt không?"]'::jsonb),
('C5','["that + S + V","whether/if + S + V","wh-word + S + V","what + S + V = the thing that...","It + be + adjective + that-clause"]'::jsonb,
 '["Xác định toàn clause làm subject/object/complement","Chọn connector theo loại thông tin còn thiếu","Giữ statement order","Kiểm whether bắt buộc sau preposition hoặc trước to V"]'::jsonb,
 '["Whoever/whatever tạo fused relative clause","The fact that khác because: một bên noun phrase, một bên reason clause","That-clause làm subject thường được extrapose bằng it"]'::jsonb,
 '["Do you know where is the office sai ở đâu?","What và that khác nhau về thành phần thiếu thế nào?","Sau depend on dùng if hay whether?"]'::jsonb),
('C6','["Active simultaneous: V-ing..., S + V","Passive/reduced relative: V3..., S + V","Earlier action: Having + V3..., S + V","While/when + V-ing/V3 (same subject)"]'::jsonb,
 '["Khôi phục clause đầy đủ","Kiểm subject hai mệnh đề có trùng không","Chọn active V-ing hay passive V3","Chọn having V3 chỉ khi cần nhấn hành động trước"]'::jsonb,
 '["Absolute phrase có subject riêng: Weather permitting,...","Conjunction đôi khi được giữ để làm rõ quan hệ","Không phải mọi V-ing đầu câu đều là participle clause; có thể là gerund subject"]'::jsonb,
 '["Driving to work, the rain started sai vì sao?","Located và locating chọn theo quan hệ nào?","Having reviewed khác reviewing ở timeline thế nào?"]'::jsonb),
('C7','["both X and Y","either X or Y","neither X nor Y","not only X but also Y","verb often agrees with nearest subject in either/or"]'::jsonb,
 '["Xác định chính xác X và Y","Kiểm parallel form","Nếu cặp tạo subject, xác định quy tắc hòa hợp","Đọc lại để kiểm phạm vi nghĩa"]'::jsonb,
 '["Whether...or có thể nêu hai khả năng","Not...but khác not only...but also","Style guide có thể ưu tiên viết lại để tránh proximity agreement khó đọc"]'::jsonb,
 '["Both A or B sai ở đâu?","Neither the files nor the folder is/are?","Not only nối adjective với noun có được không?"]'::jsonb),
('C8','["suggest/recommend/require that + S + base V","It is essential that + S + base V","British variant: should + base V","suggest + V-ing (no explicit subject)"]'::jsonb,
 '["Tìm trigger mang nghĩa yêu cầu/đề xuất","Xác định có that-clause hay complement khác","Dùng base form kể cả subject số ít","Phân biệt trigger cùng từ nhưng khác nghĩa"]'::jsonb,
 '["Insist có thể là yêu cầu hoặc khẳng định; form phụ thuộc nghĩa","Subjunctive be không đổi theo ngôi","Formal policy text thường dùng mandative subjunctive"]'::jsonb,
 '["Requires that he submits hay submit?","Suggest him to go có chuẩn trong pattern này không?","Insist that he was there có nhất thiết subjunctive không?"]'::jsonb),
('C9','["It is/was + focus + that/who + remainder","What + clause + be + focus","do/does/did + base V","even/only/especially + focused constituent"]'::jsonb,
 '["Xác định thông tin cần nhấn","Chọn cleft hoặc do-emphasis","Giữ agreement và tense trong phần còn lại","Đặt focus particle sát thành phần được nhấn"]'::jsonb,
 '["All-cleft: All we need is...","Pseudo-cleft có thể đảo: A refund is what the client requested","Only đổi vị trí có thể đổi truth conditions"]'::jsonb,
 '["Do-emphasis dùng với be được không?","It was the invoice that... nhấn phần nào?","Only đặt trước Friday khác trước submit thế nào?"]'::jsonb),
('C10','["the + comparative..., the + comparative...","comparative and comparative","twice/three times + as + adjective + as","no less than ≠ not less than","fewer + count / less + noncount"]'::jsonb,
 '["Xác định metric và denominator","Chọn cấu trúc ratio, trend hay proportional change","Bảo đảm hai vế so sánh cùng loại","Kiểm con số không bị diễn đạt mơ hồ"]'::jsonb,
 '["X percent higher than khác X percent as high as","By far thường bổ nghĩa superlative; much/far bổ nghĩa comparative","Senior/junior/prefer thường đi với to thay than"]'::jsonb,
 '["50% higher có bằng 150% as high không?","The more..., the more... cần article nào?","Prefer A than B đúng không?"]'::jsonb),
('D1','["prefix + root + suffix","Det + (Adv) + Adj + N","linking V + Adj","V + Adv / Adv + V","word form + required complement/collocation"]'::jsonb,
 '["Phân tích vị trí ngữ pháp","Lập nhanh word family","Kiểm nghĩa của affix và noun subtype","Dùng collocation/register làm tiêu chí cuối"]'::jsonb,
 '["-ive có thể tạo adjective hoặc noun tùy từ","Một số zero-derivation giữ nguyên form giữa noun và verb","Affix productivity có giới hạn; không tự tạo từ chỉ vì công thức cho phép"]'::jsonb,
 '["Economic và economical khác nghĩa thế nào?","Representative là adjective hay noun?","Sau remain dùng efficiently hay efficient?"]'::jsonb),
('D2','["verb + dependent preposition","adjective + dependent preposition","noun + preposition","verb + noun collocation","adjective + noun collocation"]'::jsonb,
 '["Xác định head word và complement","Nhớ lại cả chunk thay vì dịch giới từ","Kiểm corpus/style list nội bộ nếu hai lựa chọn gần nhau","Ghi flashcard bằng câu và contrast pair"]'::jsonb,
 '["Collocation có mức độ mạnh/yếu và khác register","Một head word có nhiều preposition theo nghĩa: agree with person, agree on topic","Preposition có thể đổi khi complement đổi"]'::jsonb,
 '["Responsible of hay for?","Increase in sales và increase by 10% khác nhau thế nào?","Make hay do a decision?"]'::jsonb),
('D3','["formal request: Please + V / We would appreciate + noun/V-ing","notification: Please be advised that + clause","purpose: This memo is intended to + V","reference: regarding/with respect to + noun phrase"]'::jsonb,
 '["Xác định thể loại văn bản và quan hệ người đọc","Chọn mức trang trọng vừa đủ","Kiểm verb pattern sau từ thay thế","Rút câu nếu nominalization làm mất rõ nghĩa"]'::jsonb,
 '["Plain language vẫn có thể trang trọng","Legal register không nên sao chép sang email thường","Politeness phụ thuộc cả modal, indirectness và context"]'::jsonb,
 '["Inform và tell có cùng object pattern không?","Regarding theo sau clause hay noun phrase?","Câu nào nên đổi nominalization về verb?"]'::jsonb),
('D4','["who/which + active V → V-ing","who/which + be + V3 → V3","the first/only + relative clause → to V","when/while + same subject → when/while + V-ing/V3"]'::jsonb,
 '["Tìm noun được bổ nghĩa","Khôi phục subject, be và relative pronoun","Chọn active/passive và timeline","Không rút nếu subject mơ hồ hoặc nghĩa thay đổi"]'::jsonb,
 '["To V thường mang nghĩa dự kiến, nhiệm vụ hoặc thứ tự","Reduced clause có thể chứa adverb/complement dài","Postmodifier chồng lớp nên phân tích từ head noun ra ngoài"]'::jsonb,
 '["The files sending yesterday sai ở đâu?","The next person who speaks có thể rút thế nào?","Khi nào không thể lược relative pronoun?"]'::jsonb),
('D5','["so + Adj/Adv + that-clause","such + (a/an) + Adj + N + that-clause","so many/few + plural N + that","so much/little + noncount N + that"]'::jsonb,
 '["Xác định head sau intensifier là adjective/adverb hay noun","Nếu là noun, kiểm countability và article","Kiểm result clause thật sự là kết quả","Chọn so/such và đọc lại"]'::jsonb,
 '["Such as dùng để nêu ví dụ và không phải such...that","So as to diễn tả mục đích, khác so...that","Đảo ngữ So + adjective + be... rất trang trọng"]'::jsonb,
 '["Such useful information cần a không?","So many demand đúng không?","Such as và such...that khác chức năng thế nào?"]'::jsonb),
('D6','["although/even though + clause","despite/in spite of + noun/V-ing","despite/in spite of the fact that + clause","sentence; however/nevertheless, sentence"]'::jsonb,
 '["Xác định connector hoạt động trong câu hay giữa câu","Kiểm sau chỗ trống là clause hay phrase","Chọn mức đối lập","Đặt dấu câu phù hợp"]'::jsonb,
 '["Much as + clause là concession trang trọng","Adj/Adv + as + S + V có thể nhượng bộ: Difficult as it was,...","However còn có nghĩa dù thế nào trong however + adjective/adverb"]'::jsonb,
 '["Despite of có chuẩn không?","However có nối hai independent clauses chỉ bằng comma không?","Even though mạnh hơn although ở điểm nào?"]'::jsonb),
('D7','["ask + wh-word/whether + S + V","tell/ask/remind + object + to V","advise + object + to V / advise + V-ing","assure + person + that-clause","explain + thing + to person"]'::jsonb,
 '["Xác định câu gốc là question, request hay statement","Chọn reporting verb theo intention","Đổi pronoun/time reference nếu viewpoint đổi","Giữ statement order và áp dụng backshift khi cần"]'::jsonb,
 '["Report verb mang stance: claim, admit, deny, confirm","Backshift có thể bỏ khi thông tin vẫn đúng","Reported request thường dùng object + to V"]'::jsonb,
 '["Explain me sai ở đâu?","Asked where was the office có lỗi gì?","Today đổi thành gì khi viewpoint lùi?"]'::jsonb),
('D8','["Structure-first: locate blank role → eliminate forms → check meaning","Verb check: subject + time + voice + agreement","Connector check: clause/phrase on both sides","Vocabulary check: collocation + register + discourse"]'::jsonb,
 '["Giới hạn 5–10 giây đầu để phân loại item","Đánh dấu head word, finite verb và connector","Loại theo invariant trước khi dịch","Nếu còn hai đáp án, dùng collocation và context","Ghi lại reason code khi sai để chọn remediation"]'::jsonb,
 '["Không có mẹo vị trí nào đúng 100%","Câu Part 6 có thể cần thông tin hai câu kế cận","Độ dài đáp án không phải tín hiệu độ đúng"]'::jsonb,
 '["Một blank sau article chắc chắn là noun không?","Part 6 transition cần đọc phạm vi nào?","Khi nào nên bỏ qua và quay lại?"]'::jsonb),
('D9','["contrast: however/nevertheless/in contrast","result: therefore/consequently/as a result","addition: moreover/furthermore/in addition","example: for example/for instance","condition alternative: otherwise"]'::jsonb,
 '["Tóm tắt câu trước bằng một nhãn ý","Dự đoán quan hệ với câu sau trước khi xem đáp án","Loại transition sai polarity","Kiểm punctuation và register","Đọc lại cả ba câu"]'::jsonb,
 '["Meanwhile có thể chỉ đồng thời hoặc chuyển focus","Indeed xác nhận/tăng cường, không đơn thuần bổ sung","Thus có thể chỉ kết quả hoặc cách thức trong văn phong học thuật"]'::jsonb,
 '["Moreover dùng cho ý trái chiều được không?","Otherwise ngầm chứa điều kiện gì?","However sau semicolon cần dấu câu nào?"]'::jsonb),
('D10','["Had + S + V3, S + would have V3","Should + S + V, imperative/will/modal...","Were + S + complement/to V, S + would V"]'::jsonb,
 '["Nhận diện auxiliary đứng trước subject nhưng không phải question","Khôi phục if-clause","Xác định loại conditional và timeline","Chọn result clause tương ứng"]'::jsonb,
 '["Were it not for / had it not been for thay if it were/had not been for","Should inversion thường giảm mức chắc chắn, không mang nghĩa nghĩa vụ","Mixed conditional cũng có thể dùng had inversion"]'::jsonb,
 '["Had we knew đúng không?","Should you need mang nghĩa gì?","Were the plan to fail tương đương câu if nào?"]'::jsonb),
('D11','["premodifier(s) + HEAD NOUN + postmodifier(s)","noun + of-phrase","noun + relative/reduced clause","verb/adjective → nominalization","apposition: noun, renaming noun phrase,"]'::jsonb,
 '["Tìm noun quyết định agreement","Chia cụm thành premodifier, head và postmodifier","Khôi phục verb từ nominalization để hiểu action","Gắn từng modifier và kiểm attachment","Viết lại thành clause đơn giản để xác nhận nghĩa"]'::jsonb,
 '["Noun adjunct thường số ít nhưng sales, operations là lexical exceptions","Chuỗi noun có thể mơ hồ và cần context","Nominalization hữu ích khi nói về process/concept nhưng không luôn là văn phong tốt"]'::jsonb,
 '["Trong customer service quality survey, head noun là gì?","Approval of the expansion ai thực hiện hành động?","Khi nào nên đổi implementation thành implement?"]'::jsonb)
)
insert into learning.topic_learning_guides
    (topic_id, formula_patterns, application_steps, extensions, self_check_prompts)
select kt.id, d.formulas, d.steps, d.extensions, d.checks
from guide_data d
join learning.knowledge_topics kt
  on kt.course_version_id = '60000000-0000-4000-8000-000000000001'
 and kt.code = d.code;

insert into learning.lesson_versions
    (id, course_version_id, module_id, code, version, lesson_type, title, objectives,
     language, level_label, skill, primary_tags, estimated_minutes, sequence,
     quiz_question_count, recommended_accuracy, is_level_checkpoint, state,
     author_name, rights_reference, published_at)
select gen_random_uuid(), kt.course_version_id, cm.id, 'LESSON-' || kt.code, 'v1',
       'Concept', kt.code || ' · ' || kt.title_vi, kt.learning_objectives,
       'vi', cl.code, 'Reading-Grammar', jsonb_build_array(kt.primary_tag),
       kt.estimated_minutes, row_number() over (order by cl.sequence, kt.sequence),
       case when cl.code = 'D' then 10 else 8 end, 0.8000, false, 'Published',
       'TOEIC Learning Editorial Team',
       'USER_SUPPLIED_OUTLINE_AND_ORIGINAL_EDITORIAL_EXPANSION_V1',
       '2026-09-22T00:00:00Z'
from learning.knowledge_topics kt
join learning.curriculum_levels cl on cl.id = kt.level_id
join learning.course_modules cm on cm.level_id = cl.id
where kt.course_version_id = '60000000-0000-4000-8000-000000000001';

insert into learning.lesson_versions
    (id, course_version_id, module_id, code, version, lesson_type, title, objectives,
     language, level_label, skill, primary_tags, estimated_minutes, sequence,
     quiz_question_count, recommended_accuracy, is_level_checkpoint, state,
     author_name, rights_reference, published_at)
select gen_random_uuid(), cl.course_version_id, cm.id, 'CHECKPOINT-' || cl.code, 'v1',
       'Checkpoint', 'Checkpoint mức ' || cl.code || ' · ' || cl.title,
       jsonb_build_array(
           'Đánh giá khả năng áp dụng kiến thức của cả mức trong câu mới',
           'Xác định chủ điểm cần ôn dựa trên lỗi có primary tag',
           'Dùng kết quả làm gợi ý chuyển mức, không quy đổi thành điểm TOEIC'),
       'vi', cl.code, 'Reading-Checkpoint',
       jsonb_build_array('checkpoint.' || lower(cl.code)),
       case cl.code when 'A' then 45 when 'D' then 75 else 60 end,
       40 + cl.sequence, cl.checkpoint_question_count, cl.checkpoint_pass_rate,
       true, 'Published', 'TOEIC Learning Editorial Team',
       'USER_SUPPLIED_OUTLINE_AND_ORIGINAL_EDITORIAL_EXPANSION_V1',
       '2026-09-22T00:00:00Z'
from learning.curriculum_levels cl
join learning.course_modules cm on cm.level_id = cl.id
where cl.course_version_id = '60000000-0000-4000-8000-000000000001';

insert into learning.lesson_topics (lesson_version_id, topic_id, topic_order)
select lv.id, kt.id, 1
from learning.lesson_versions lv
join learning.knowledge_topics kt
  on lv.course_version_id = kt.course_version_id
 and lv.code = 'LESSON-' || kt.code
where lv.course_version_id = '60000000-0000-4000-8000-000000000001';

insert into learning.lesson_topics (lesson_version_id, topic_id, topic_order)
select lv.id, kt.id, kt.sequence
from learning.lesson_versions lv
join learning.curriculum_levels cl
  on cl.course_version_id = lv.course_version_id
 and lv.code = 'CHECKPOINT-' || cl.code
join learning.knowledge_topics kt on kt.level_id = cl.id
where lv.course_version_id = '60000000-0000-4000-8000-000000000001';

with ordered_lessons as (
    select lv.id, lag(lv.id) over (order by lv.sequence) as previous_id
    from learning.lesson_versions lv
    where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
      and lv.lesson_type = 'Concept'
)
insert into learning.lesson_prerequisites
    (lesson_version_id, prerequisite_lesson_version_id, requirement_type)
select id, previous_id, 'Recommended'
from ordered_lessons
where previous_id is not null;

insert into learning.lesson_prerequisites
    (lesson_version_id, prerequisite_lesson_version_id, requirement_type)
select checkpoint.id, concept.id, 'RequiredForCheckpoint'
from learning.lesson_versions checkpoint
join learning.curriculum_levels cl
  on cl.course_version_id = checkpoint.course_version_id
 and checkpoint.code = 'CHECKPOINT-' || cl.code
join learning.course_modules cm on cm.level_id = cl.id
join learning.lesson_versions concept
  on concept.module_id = cm.id and concept.lesson_type = 'Concept'
where checkpoint.course_version_id = '60000000-0000-4000-8000-000000000001';

insert into learning.lesson_pages (id, lesson_version_id, title, page_order, required)
select gen_random_uuid(), lv.id, page.title, page.page_order, true
from learning.lesson_versions lv
cross join (values (1,'Hiểu khái niệm và công thức'),
                   (2,'Áp dụng vào câu TOEIC và mở rộng')) page(page_order,title)
where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
  and lv.lesson_type = 'Concept';

insert into learning.lesson_pages (id, lesson_version_id, title, page_order, required)
select gen_random_uuid(), lv.id, 'Hướng dẫn checkpoint và cách đọc kết quả', 1, true
from learning.lesson_versions lv
where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
  and lv.lesson_type = 'Checkpoint';

insert into learning.lesson_blocks (id, page_id, block_order, block_type, content)
select gen_random_uuid(), lp.id, block.block_order, block.block_type,
       case block.block_order
           when 1 then jsonb_build_object(
               'heading', kt.code || ' · ' || kt.title_vi,
               'body', kt.summary,
               'objectives', kt.learning_objectives)
           when 2 then jsonb_build_object(
               'heading', 'Công thức và mẫu cấu trúc',
               'patterns', guide.formula_patterns,
               'rules', kt.core_knowledge,
               'note', 'Công thức là khung nhận diện; luôn kiểm tra nghĩa và ngữ cảnh.')
           else jsonb_build_object(
               'heading', 'Ví dụ có phân tích',
               'examples', kt.worked_examples)
       end
from learning.lesson_pages lp
join learning.lesson_versions lv on lv.id = lp.lesson_version_id
join learning.lesson_topics lt on lt.lesson_version_id = lv.id
join learning.knowledge_topics kt on kt.id = lt.topic_id
join learning.topic_learning_guides guide on guide.topic_id = kt.id
cross join (values (1,'Text'),(2,'Rule'),(3,'Example')) block(block_order,block_type)
where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
  and lv.lesson_type = 'Concept' and lp.page_order = 1;

insert into learning.lesson_blocks (id, page_id, block_order, block_type, content)
select gen_random_uuid(), lp.id, block.block_order, block.block_type,
       case block.block_order
           when 1 then jsonb_build_object(
               'heading', 'Quy trình áp dụng',
               'steps', guide.application_steps,
               'examUse', 'Thực hiện cấu trúc trước, nghĩa sau; ghi primary tag khi trả lời sai.')
           when 2 then jsonb_build_object(
               'heading', 'Bẫy thường gặp và cách tránh',
               'items', kt.common_traps)
           when 3 then jsonb_build_object(
               'heading', 'Mở rộng để hiểu sâu hơn',
               'items', guide.extensions,
               'scopeNote', 'Phần mở rộng giúp đọc hiểu; không bắt buộc ghi nhớ ngay ở lượt học đầu.')
           else jsonb_build_object(
               'heading', 'Tự kiểm tra trước quiz',
               'prompts', guide.self_check_prompts,
               'instruction', 'Tự giải thích thành lời; nếu chưa giải thích được, quay lại công thức và ví dụ.')
       end
from learning.lesson_pages lp
join learning.lesson_versions lv on lv.id = lp.lesson_version_id

join learning.lesson_topics lt on lt.lesson_version_id = lv.id
join learning.knowledge_topics kt on kt.id = lt.topic_id
join learning.topic_learning_guides guide on guide.topic_id = kt.id
cross join (values (1,'Text'),(2,'Contrast'),(3,'Tip'),(4,'MiniCheck')) block(block_order,block_type)
where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
  and lv.lesson_type = 'Concept' and lp.page_order = 2;

insert into learning.lesson_blocks (id, page_id, block_order, block_type, content)
select gen_random_uuid(), lp.id, block.block_order, block.block_type,
       case block.block_order
           when 1 then jsonb_build_object(
               'heading','Cách làm checkpoint',
               'items',jsonb_build_array(
                   'Làm trong một lượt không xem lời giải giữa chừng.',

                   'Câu bỏ trống tính là chưa đúng và vẫn được dùng để tìm chủ điểm cần ôn.',
                   'Kết quả chỉ là chỉ báo học tập, không phải band hoặc điểm TOEIC chính thức.'))
           else jsonb_build_object(
               'heading','Sau khi nộp',
               'items',jsonb_build_array(
                   'Đạt ngưỡng: đề xuất mức kế tiếp nhưng người học vẫn có thể ôn lại.',
                   'Chưa đạt: chèn tối đa hai buổi remediation cho tag yếu có đủ dữ liệu.',
                   'Cho làm lại sau 3–5 ngày; mức D khuyến nghị sau 7 ngày.'))
       end
from learning.lesson_pages lp
join learning.lesson_versions lv on lv.id = lp.lesson_version_id
cross join (values (1,'Text'),(2,'Tip')) block(block_order,block_type)
where lv.course_version_id = '60000000-0000-4000-8000-000000000001'
  and lv.lesson_type = 'Checkpoint';

insert into learning.roadmap_templates
    (id, course_version_id, version, title, algorithm_version,
     session_minutes_min, session_minutes_max, sessions_per_week_min,
     sessions_per_week_max, review_ratio, learning_ratio, buffer_ratio,
     personalization_policy, state)
values
    ('65000000-0000-4000-8000-000000000001',
     '60000000-0000-4000-8000-000000000001',
     'roadmap-2026.09-v1',
     'Lộ trình TOEIC Reading theo nhịp học cá nhân',
     'rule-plan-v1',30,45,3,4,0.2500,0.5500,0.2000,
     '{
       "unknownPlacement":{"default":"offer-level-choice","neverAssignBand":true},
       "lessonQuiz":{"needsReviewBelow":0.80,"blocksCompletion":false},
       "checkpoint":{"weakTagLimit":2,"retryAfterDays":{"default":3,"levelD":7}},
       "deadlineCompression":{
         "mergeNewConceptsInOneSession":false,
         "preserveCheckpoints":true,
         "actions":["increase-available-minutes","prioritize-essential-lessons","reduce-optional-extension"],
         "markAtRiskWhenCapacityInsufficient":true
       },
       "timeBudget":{"review":0.25,"lessonOrDrill":0.55,"buffer":0.20}
     }'::jsonb,
     'Published');

with week_data(week_number, level_code, title, goal, vocabulary_theme,
    checkpoint_kind, pass_rate) as (values
(1,'A','Dựng khung câu','Nhận diện từ loại và tìm được chủ ngữ, động từ chính, tân ngữ/bổ ngữ.','Văn phòng và chức danh','LessonQuiz',0.7000),
(2,'A','Thời hiện tại và quá khứ','Chọn thì theo timeline thay vì dựa vào một từ khóa đơn lẻ.','Lịch làm việc và sự kiện','LessonQuiz',0.7000),
(3,'A','Tương lai và nhóm danh từ','Diễn đạt kế hoạch/deadline và chọn lượng từ đúng countability.','Mua sắm và đặt hàng','LessonQuiz',0.7000),
(4,'A','Xác định danh từ và tham chiếu','Dùng article, determiner và pronoun để câu rõ người/vật được nói tới.','Tài liệu và giao tiếp nội bộ','LessonQuiz',0.7000),
(5,'A','So sánh và ôn nền tảng','So sánh đúng đối tượng và kết nối lại A1–A8 bằng bài trộn.','Chi phí và hiệu suất','MixedReview',0.7000),
(6,'A','Checkpoint A','Đánh giá 25 câu Part 5 nền tảng; xác định tối đa hai tag cần củng cố.','Ôn tích lũy A','LevelCheckpoint',0.7000),
(7,'B','Hai lớp thời gian hoàn thành','Phân biệt present perfect, past perfect và mốc quá khứ đơn.','Nhân sự và hồ sơ','LessonQuiz',0.7000),
(8,'B','Tương lai nâng cao và bị động','Chọn trọng tâm tiến trình/hoàn tất và active/passive theo thông tin.','Dự án và quy trình','LessonQuiz',0.7000),
(9,'B','Điều kiện thực và giả định','Phân loại zero/first/second conditional và tránh trộn timeline.','Hợp đồng và phương án','LessonQuiz',0.7000),
(10,'B','Modal và verb complement','Diễn đạt nghĩa vụ/sắc thái và chọn V-ing/to V theo pattern.','Quy định và quyết định','LessonQuiz',0.7000),
(11,'B','Mệnh đề và liên kết','Gắn relative clause đúng antecedent và chọn connector theo clause/phrase.','Báo cáo và tuyển dụng','LessonQuiz',0.7000),
(12,'B','Giới từ và ôn trung cấp','Phân biệt deadline/duration/location và ôn B1–B9 theo lỗi.','Lịch họp và địa điểm','MixedReview',0.7000),
(13,'B','Checkpoint B','Đánh giá 40 câu Part 5/6 ở mức trung bình và lập kế hoạch củng cố.','Ôn tích lũy B','LevelCheckpoint',0.7000),
(14,'C','Giả định quá khứ và bị động nâng cao','Kết nối timeline giả định với reporting passive/causative.','Rủi ro và bảo trì','LessonQuiz',0.7500),
(15,'C','Đảo ngữ có tín hiệu','Nhận diện trigger và chọn đúng auxiliary thay vì học thuộc bề mặt.','Văn bản trang trọng','LessonQuiz',0.7500),
(16,'C','Song song và mệnh đề danh từ','Giữ cấu trúc cân xứng và statement order trong embedded clause.','Marketing và yêu cầu','LessonQuiz',0.7500),
(17,'C','Rút gọn bằng phân từ','Rút gọn khi cùng chủ thể và tránh dangling modifier.','Hợp đồng và địa điểm','LessonQuiz',0.7500),
(18,'C','Cặp liên từ và giả định yêu cầu','Dùng correlative conjunctions song song và mandative subjunctive.','Pháp lý và phối hợp','LessonQuiz',0.7500),
(19,'C','Nhấn mạnh, số liệu và ôn nâng cao','Đặt focus đúng chỗ và diễn đạt so sánh số liệu không mơ hồ.','Tài chính và thuyết trình','MixedReview',0.7500),
(20,'C','Checkpoint C lần đầu','Đánh giá 40 câu nâng cao; kết quả thấp tạo đề xuất củng cố, không khóa học.','Ôn tích lũy C','LevelCheckpoint',0.7500),
(21,'C','Tuần củng cố thích ứng','Ôn tối đa hai tag yếu từ checkpoint hoặc luyện tổng hợp nếu đã đạt.','Theo tag cá nhân','MixedReview',0.7500),
(22,'D','Word form theo nghĩa và collocation','Giải quyết nhiều đáp án cùng đúng từ loại bằng nghĩa và collocation.','Kinh tế và vận hành','LessonQuiz',0.8000),
(23,'D','Collocation theo cụm','Ghi nhớ dependent preposition và lexical chunk bằng retrieval.','Collocation công việc','LessonQuiz',0.8000),
(24,'D','Register kinh doanh','Chọn văn phong đúng thể loại, chính xác nhưng không cầu kỳ giả tạo.','Email và thông báo','LessonQuiz',0.8000),
(25,'D','Cấu trúc rút gọn sâu','Phân tích noun phrase dài và khôi phục clause để kiểm voice/timeline.','Chính sách và tài liệu','LessonQuiz',0.8000),
(26,'D','Kết quả và nhượng bộ','Phân biệt so/such và connector theo clause/phrase.','Đàm phán và tiến độ','LessonQuiz',0.8000),
(27,'D','Tường thuật và ôn D1–D6','Chọn reporting pattern, viewpoint và backshift hợp lý.','Khách hàng và báo cáo','MixedReview',0.8000),
(28,'D','Quy trình tránh bẫy Part 5/6','Phân loại item, loại theo cấu trúc và ghi reason code khi sai.','Bẫy trong đề','LessonQuiz',0.8000),
(29,'D','Discourse trong Part 6','Dự đoán quan hệ câu trước khi chọn transition.','Thông báo và email','LessonQuiz',0.8000),
(30,'D','Đảo điều kiện và cấu trúc nén','Khôi phục conditional và tách head noun khỏi chuỗi modifier.','Điều khoản và phân tích','MixedReview',0.8500),
(31,'D','Checkpoint hoàn thành lộ trình','Đánh giá 46 câu Part 5/6; báo độ chính xác/tag yếu, không quy đổi tổng điểm TOEIC.','Ôn tích lũy toàn khóa','LevelCheckpoint',0.8500)
)
insert into learning.roadmap_weeks
    (id, roadmap_template_id, level_id, week_number, title, weekly_goal,
     vocabulary_theme, checkpoint_kind, pass_rate, remediation_rule)
select gen_random_uuid(), rt.id, cl.id, d.week_number, d.title, d.goal,
       d.vocabulary_theme, d.checkpoint_kind, d.pass_rate,
       case d.checkpoint_kind
         when 'LevelCheckpoint' then jsonb_build_object(
             'onBelowThreshold','propose-remediation',
             'weakTagLimit',2,
             'retryAfterDays',case when d.level_code = 'D' then 7 else 3 end,
             'blocksOtherLearning',false)
         when 'MixedReview' then jsonb_build_object(
             'source','first-attempt-and-checkpoint-errors',
             'maxWeakTags',2,
             'allowGeneralReviewWhenInsufficientEvidence',true)
         else jsonb_build_object(
             'onQuizBelow',0.80,
             'action','mark-needs-review-and-suggest-guided-practice',
             'blocksLessonCompletion',false)
       end
from week_data d
join learning.roadmap_templates rt
  on rt.id = '65000000-0000-4000-8000-000000000001'
join learning.curriculum_levels cl
  on cl.course_version_id = rt.course_version_id and cl.code = d.level_code;

with week_topics(week_number, topic_order, topic_code) as (values
(1,1,'A1'),(1,2,'A2'),
(2,1,'A3'),(2,2,'A4'),
(3,1,'A5'),(3,2,'A6'),
(4,1,'A7'),(4,2,'A8'),
(5,1,'A9'),
(7,1,'B1'),(7,2,'B2'),
(8,1,'B3'),(8,2,'B4'),
(9,1,'B5'),
(10,1,'B6'),(10,2,'B7'),
(11,1,'B8'),(11,2,'B9'),
(12,1,'B10'),
(14,1,'C1'),(14,2,'C2'),
(15,1,'C3'),
(16,1,'C4'),(16,2,'C5'),
(17,1,'C6'),
(18,1,'C7'),(18,2,'C8'),
(19,1,'C9'),(19,2,'C10'),
(22,1,'D1'),
(23,1,'D2'),
(24,1,'D3'),
(25,1,'D4'),
(26,1,'D5'),(26,2,'D6'),
(27,1,'D7'),
(28,1,'D8'),
(29,1,'D9'),
(30,1,'D10'),(30,2,'D11')
)
insert into learning.roadmap_activities
    (id, roadmap_week_id, lesson_version_id, topic_id, session_order,
     activity_type, title, estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, lv.id, kt.id, d.topic_order * 2,
       'Lesson', kt.code || ' · ' || kt.title_vi, kt.estimated_minutes, true,
       '{"bucket":"lessonOrDrill","splittableAtPageBoundary":true,"bundleFollowingQuizWhenFits":true,"deferWholePageIfSlotTooShort":true}'::jsonb
from week_topics d
join learning.roadmap_weeks rw
  on rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001'
 and rw.week_number = d.week_number
join learning.knowledge_topics kt
  on kt.course_version_id = '60000000-0000-4000-8000-000000000001'
 and kt.code = d.topic_code
join learning.lesson_versions lv
  on lv.course_version_id = kt.course_version_id and lv.code = 'LESSON-' || kt.code;

with week_topics(week_number, topic_order, topic_code) as (values
(1,1,'A1'),(1,2,'A2'),(2,1,'A3'),(2,2,'A4'),(3,1,'A5'),(3,2,'A6'),
(4,1,'A7'),(4,2,'A8'),(5,1,'A9'),(7,1,'B1'),(7,2,'B2'),(8,1,'B3'),(8,2,'B4'),
(9,1,'B5'),(10,1,'B6'),(10,2,'B7'),(11,1,'B8'),(11,2,'B9'),(12,1,'B10'),
(14,1,'C1'),(14,2,'C2'),(15,1,'C3'),(16,1,'C4'),(16,2,'C5'),(17,1,'C6'),
(18,1,'C7'),(18,2,'C8'),(19,1,'C9'),(19,2,'C10'),(22,1,'D1'),(23,1,'D2'),
(24,1,'D3'),(25,1,'D4'),(26,1,'D5'),(26,2,'D6'),(27,1,'D7'),(28,1,'D8'),
(29,1,'D9'),(30,1,'D10'),(30,2,'D11')
)
insert into learning.roadmap_activities
    (id, roadmap_week_id, lesson_version_id, topic_id, session_order,
     activity_type, title, estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, lv.id, kt.id, d.topic_order * 2 + 1,
       'Quiz', 'Quiz ' || kt.code || ' · áp dụng và giải thích lựa chọn', 10, true,
       '{"bucket":"lessonOrDrill","splittable":false,"needsReviewBelow":0.80,"blocksLessonCompletion":false}'::jsonb
from week_topics d
join learning.roadmap_weeks rw
  on rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001'
 and rw.week_number = d.week_number
join learning.knowledge_topics kt
  on kt.course_version_id = '60000000-0000-4000-8000-000000000001'
 and kt.code = d.topic_code
join learning.lesson_versions lv
  on lv.course_version_id = kt.course_version_id and lv.code = 'LESSON-' || kt.code;

insert into learning.roadmap_activities
    (id, roadmap_week_id, session_order, activity_type, title,
     estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, 1, 'Flashcard',
       'Ôn từ/cụm từ · ' || coalesce(rw.vocabulary_theme,'theo tag cá nhân'),
       10, false,
       '{"bucket":"review","newItemsPerSession":{"min":8,"max":12},"prioritizeDue":true,"canSkip":true}'::jsonb
from learning.roadmap_weeks rw
where rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001';

insert into learning.roadmap_activities
    (id, roadmap_week_id, session_order, activity_type, title,
     estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, 8, 'MixedReview',
       'Ôn trộn theo lỗi lần đầu và tag cần luyện', 30, true,
       '{"bucket":"review","source":"first-attempt-errors","weakTagLimit":2,"useGeneralMixWhenEvidenceInsufficient":true}'::jsonb
from learning.roadmap_weeks rw
where rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001'
  and rw.checkpoint_kind = 'MixedReview';

insert into learning.roadmap_activities
    (id, roadmap_week_id, lesson_version_id, session_order, activity_type,
     title, estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, lv.id, 2, 'Checkpoint', lv.title,
       lv.estimated_minutes, true,
       '{"bucket":"lessonOrDrill","splittable":false,"requiresConfirmedLongSession":true,"showAnswersAfterSubmit":true}'::jsonb
from learning.roadmap_weeks rw
join learning.curriculum_levels cl on cl.id = rw.level_id
join learning.lesson_versions lv
  on lv.course_version_id = cl.course_version_id
 and lv.code = 'CHECKPOINT-' || cl.code
where rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001'
  and rw.checkpoint_kind = 'LevelCheckpoint';

insert into learning.roadmap_activities
    (id, roadmap_week_id, session_order, activity_type, title,
     estimated_minutes, required, scheduling_policy)
select gen_random_uuid(), rw.id, 2, 'Remediation',
       'Buổi củng cố tối đa hai tag yếu từ checkpoint C', 35, false,
       '{"bucket":"lessonOrDrill","dynamicSource":"latest-checkpoint","weakTagLimit":2,"omitWhenNoQualifiedWeakTag":true}'::jsonb
from learning.roadmap_weeks rw
where rw.roadmap_template_id = '65000000-0000-4000-8000-000000000001'
  and rw.week_number = 21;
