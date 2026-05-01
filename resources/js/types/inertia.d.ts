export {}

declare module '@inertiajs/core' {
    interface PageProps {
        app?: {
            name: string
        }
    }
}
