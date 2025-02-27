function formatDate(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date)) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${year}-${month}-${day}`;
    }
    return dateString; // Если не удаётся преобразовать, возвращаем исходное значение
}

const translations = {
    // Таблицы
    student: 'Ученики',
    teacher: 'Преподаватели',
    subject: 'Предметы',
    exam: 'Экзамены',
    examresult: 'Результаты экзаменов',
    academicperfomance: 'Успеваемость',
    studentachievements: 'Достижения учеников',
    strugglingstudent: 'Отстающие ученики',
    studyrecommendation: 'Рекомендации по обучению',
    class: 'Классы',
    new_view: 'Тест...',
    
    // Столбцы
    ID: 'Номер строки',
    FullName: 'Полное имя',
    BirthDate: 'Дата рождения',
    EnrollmentDate: 'Дата зачисления',
    GradeLevel: 'Уровень обучения',
    Email: 'Электронная почта',
    Specialization: 'Специализация',
    HireDate: 'Дата найма',
    Name: 'Название',
    Description: 'Описание',
    Date: 'Дата',
    SubjectID: 'Номер предмета',
    ExamID: 'Номер экзамена',
    StudentID: 'Номер студента',
    Grade: 'Оценка',
    Comment: 'Комментарий',
    AverageGrade: 'Средняя оценка',
    AchievementDate: 'Дата достижения',
    Reason: 'Причина',
    TeacherID: 'Номер преподавателя',
    Recommendation: 'Рекомендация',

    // Процедуры и функции
    addNewStudent: 'Добавить ученика',
    ChangeGradeLevel: 'Изменить класс ученика',
    avgExamGrade: 'Средняя оценка за экзамен (номер экзамена)',
    BadOrGood: 'Плохой или хороший ученик?',
    'int': 'Целое число',
    'decimal': 'Вещественное число',
    'text': 'Текст',
    'id': 'Номер',
    'NewLVL': 'Новый класс',
    'GradeLvl': 'Класс обучения',
    'PrevGrade': 'Прошлый средний балл',
    'StudID': 'Номер ученика'
};

function translate(key) {
    return translations[key] || translations[key.toLowerCase()] || key;
}
