const bar = 'rounded-sm bg-secondary';

// Quiet placeholder in the shape of the default (Editorial) template.
export default function LoadingPublicProfile() {
  return (
    <main
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <div className="mx-auto w-full max-w-[44rem] px-6 pt-24 sm:px-8">
        <div className={`h-11 w-3/5 ${bar}`} />
        <div className={`mt-4 h-5 w-2/5 ${bar}`} />
        <div className={`mt-7 h-3 w-1/2 ${bar}`} />
        {[0, 1].map((item) => (
          <div key={item} className="mt-16">
            <div className={`h-2.5 w-20 ${bar}`} />
            <div className={`mt-7 h-4 w-2/3 ${bar}`} />
            <div className={`mt-3 h-3 w-full ${bar}`} />
            <div className={`mt-3 h-3 w-5/6 ${bar}`} />
          </div>
        ))}
      </div>
    </main>
  );
}
