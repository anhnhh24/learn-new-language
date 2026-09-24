-- Migration 009: Cap nhat he thong phan he kien thuc TOEIC Reading (Knowledge Architecture)
-- Thay doi cau truc hien thi tu tuan hoc co dinh sang cac phan he chuyen de kien thuc bai ban (Phan 1 den Phan 4)

-- 1. Cap nhat mo ta tong the khoa hoc sang He thong kien thuc
update learning.course_versions
set summary = 'Hệ thống kiến thức TOEIC Reading gồm 4 phân hệ lớn, 40 chuyên đề ngữ pháp - từ vựng cốt lõi và 4 bài thi Checkpoint kiểm định năng lực độc lập.'
where slug = 'toeic-reading-grammar-foundation';

-- 2. Cap nhat tieu de cac phan he cap do chuan hoa (Levels A -> D)
update learning.curriculum_levels
set title = 'Phần 1: Cấu trúc câu & 4 từ loại cốt lõi (Củng cố nền tảng)'
where code = 'A' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.curriculum_levels
set title = 'Phần 2: Hệ thống các thì & Mệnh đề liên kết (Trung cấp ứng dụng)'
where code = 'B' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.curriculum_levels
set title = 'Phần 3: Cấu trúc nâng cao & Điểm ngữ pháp phức (Nâng cao có kiểm soát)'
where code = 'C' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.curriculum_levels
set title = 'Phần 4: Độ chính xác chuyên sâu & Né bẫy Part 5/6'
where code = 'D' and course_version_id = '60000000-0000-4000-8000-000000000001';

-- 3. Cap nhat tieu de va mo ta cac modules phan he kien thuc
update learning.course_modules
set title = 'Phần 1: Cấu trúc câu và từ loại cốt lõi',
    summary = 'Dựng lại cấu trúc câu S–V–O, các thì cơ bản, mạo từ và nhóm danh từ.'
where code = 'MODULE-A' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.course_modules
set title = 'Phần 2: Hệ thống các thì và mệnh đề liên kết',
    summary = 'Các thì hoàn thành, bị động, điều kiện, mệnh đề quan hệ và liên từ kết hợp.'
where code = 'MODULE-B' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.course_modules
set title = 'Phần 3: Cấu trúc nâng cao và ngữ pháp phức',
    summary = 'Đảo ngữ, phân từ rút gọn, câu giả định, cấu trúc song song và nhấn mạnh.'
where code = 'MODULE-C' and course_version_id = '60000000-0000-4000-8000-000000000001';

update learning.course_modules
set title = 'Phần 4: Độ chính xác chuyên sâu và né bẫy Part 5/6',
    summary = 'Word form khó, collocation công sở, văn phong thương mại, liên từ chuyển tiếp và cấu trúc nén.'
where code = 'MODULE-D' and course_version_id = '60000000-0000-4000-8000-000000000001';
