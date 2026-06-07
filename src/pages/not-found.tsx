import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="jf-surface mx-4 w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg border border-amber-300/40 bg-amber-300/10">
          <AlertCircle className="h-8 w-8 text-amber-300" />
        </div>

        <p className="jf-eyebrow mb-4 text-xs">Not Found</p>
        <h1 className="text-2xl font-black text-white">404 Page Not Found</h1>
        <p className="mt-4 text-sm text-slate-300">
          Did you forget to add the page to the router?
        </p>
      </div>
    </div>
  );
}
