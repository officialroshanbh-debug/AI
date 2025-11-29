export function ChatSkeleton() {
  return (
    <div className="flex gap-4 p-4 md:p-6 animate-pulse">
      <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
      <div className="flex-1 space-y-3">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
          <div className="h-4 w-4/6 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function ChatInputSkeleton() {
  return (
    <div className="border-t bg-background p-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 h-[60px] bg-muted rounded-md animate-pulse" />
        <div className="h-[60px] w-[60px] bg-muted rounded-md animate-pulse" />
      </div>
    </div>
  );
}

