UPDATE event_content
SET title = replace(title, 'Sistema de Computación de Datos', 'Sistema de Cómputos de Datos'),
    body = replace(body, 'Sistema de Computación de Datos', 'Sistema de Cómputos de Datos')
WHERE title LIKE '%Sistema de Computación de Datos%' OR body LIKE '%Sistema de Computación de Datos%';

UPDATE schedule_entries
SET title = replace(title, 'Sistema de Computación de Datos', 'Sistema de Cómputos de Datos'),
    description = replace(description, 'Sistema de Computación de Datos', 'Sistema de Cómputos de Datos')
WHERE title LIKE '%Sistema de Computación de Datos%' OR description LIKE '%Sistema de Computación de Datos%';
