import { APP_COMMIT_URL, APP_GIT_SHORT_SHA, APP_RELEASE_TAG_URL, APP_VERSION } from "@/lib/version";

export function AppFooter() {
  return (
    <footer className="mt-8 py-4 text-center text-sm text-muted-foreground border-t">
      <div className="flex flex-col items-center gap-2">
        <p>
          Made with 🩷 by HS Trejo Luna, Frontend Developer at{' '}
          <a 
            href="https://mostwant.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-4"
          >
           ⚡️ Most Want Tech ⚡️
          </a>
        </p>
        <p className="text-xs">
          Version{' '}
          <a
            href={APP_RELEASE_TAG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline underline-offset-4"
          >
            v{APP_VERSION}
          </a>
          {APP_GIT_SHORT_SHA && (
            <>
              {' '}· Build{' '}
              <a
                href={APP_COMMIT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline underline-offset-4"
              >
                #{APP_GIT_SHORT_SHA}
              </a>
            </>
          )}
        </p>
      </div>
    </footer>
  )
}
