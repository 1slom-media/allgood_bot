CREATE TABLE users(
    id serial primary key,
    first_name varchar(20),
    last_name varchar (20),
    phone_number varchar(25),
    chat_id varchar(50),
    role default ('merchant')
);

CREATE TABLE faq(
    id serial primary key,
    question text,
    answer text,
    lang text
);

CREATE TABLE requests(
    id serial primary key,
    user_chat_id text,
    request_text text,
    status_uz text,
    status_ru text
);

CREATE TABLE merchants_bot(
    id serial primary key,
    merchant_id int,
    group_id bigint,
    merchant_name text
);

INSERT INTO users VALUES('islom','tagayev','998901536621','7690235728','admin');

INSERT INTO
    faq (question, answer)
VALUES
    (
        'Allgood Nasiya bilan hamkor bo''lish uchun qanday murojaat qilish mumkin?',
        'Agar siz hamkor bo''lishni va Allgood Nasiya haqida batafsil ma''lumot olishni istasangiz, biz bilan +998 55 520 90 90 raqamiga qo''ng''iroq qilib, rasmiy saytda allgoodnasiya.uz so''rov qoldirishingiz yoki telegramda @nasiya hamkor bilan bog''lanishingiz mumkin.'
    ),
    (
        'To''lovlarni muddatli sotish uchun yosh cheklovlari bormi?',
        'Ha, mijozning yoshi 21 dan 65 yoshgacha bo''lishi kerak.'
    ),
    (
        'Ro''yxatdan o''tish uchun qanday kartalar kerak?',
        'Allgood Nasiya tizimi O''zbekistonning barcha bank kartalarini, korporativ kartalar, shuningdek, Visa, MasterCard va boshqa xalqaro kartalarni qabul qiladi.'
    );