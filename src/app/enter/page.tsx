'use client';

export default function EnterPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('form submitted!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="test input" />
      <button type="submit">Submit</button>
    </form>
  );
}
