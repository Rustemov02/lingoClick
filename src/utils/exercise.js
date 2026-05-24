export function isDialog(exercise) {
  return exercise?.type === 'dialog';
}

export function getExercisePreview(exercise) {
  if (!exercise) return '';
  if (isDialog(exercise)) {
    const first = exercise.dialogLines?.[0]?.text;
    if (first) return `Dialoq: ${first.length > 60 ? `${first.slice(0, 60)}…` : first}`;
    return 'Dialoq';
  }
  return exercise.text || '';
}

export function validateExercisePayload({ type, text, dialogLines }) {
  if (type === 'dialog') {
    const lines = (dialogLines || []).filter((l) => l.text?.trim());
    if (lines.length === 0) return 'Dialoq üçün ən azı bir sətir lazımdır';
    return null;
  }
  if (!text?.trim()) return 'Cümlə mətni boş ola bilməz';
  return null;
}
