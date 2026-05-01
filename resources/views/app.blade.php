<!DOCTYPE html>
<html class="h-full bg-gray-200" lang="vi" data-app-name="{{ e(config('app.name')) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    @inertiaHead
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="font-sans antialiased leading-none text-gray-800">
@inertia
</body>
</html>