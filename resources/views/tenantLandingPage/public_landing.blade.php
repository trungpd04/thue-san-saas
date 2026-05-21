<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $tenant->name }} - Hệ Thống Đặt Lịch Sân Trực Tuyến</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</head>
<body class="bg-slate-50 text-slate-900 antialiased">

    <header class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <span class="text-xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                🏟️ {{ mb_strtoupper($tenant->name, 'UTF-8') }}
            </span>
            <div class="flex items-center gap-4">
                <a href="tel:{{ $tenant->phone }}" class="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-100 transition flex items-center gap-1">
                    📞 Hotline: {{ $tenant->phone }}
                </a>
            </div>
        </div>
    </header>

    <section class="bg-gradient-to-b from-emerald-50/40 to-slate-50 py-16 border-b border-slate-200/60">
        <div class="max-w-4xl mx-auto text-center px-4">
            <span class="text-emerald-700 bg-emerald-100/80 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3">
                ⚽ Trang Đặt Lịch Công Khai Chính Thức
            </span>
            <h1 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 mb-4 leading-tight">
                Chào mừng bạn đến với <br>
                <span class="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{{ $tenant->name }}</span>
            </h1>
            
            <div class="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-sm text-slate-600 bg-white px-6 py-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p class="flex items-center gap-1.5">
                    📍 <strong class="text-slate-900">Địa chỉ:</strong> {{ $tenant->address }}
                </p>
                <div class="hidden sm:block w-px h-4 bg-slate-300"></div>
                <p class="flex items-center gap-1.5">
                    📞 <strong class="text-slate-900">Hotline đặt sân nhanh:</strong> {{ $tenant->phone }}
                </p>
            </div>
        </div>
    </section>

    <main class="max-w-6xl mx-auto px-4 py-16">
        <div class="text-center mb-8">
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">Danh Sách Cụm Sân Thể Thao</h2>
            <p class="mt-2 text-slate-500 text-xs sm:text-sm">Vui lòng chọn cụm sân nhỏ bên dưới để tiến hành xem lịch trống và đặt ca đá trực tuyến.</p>
        </div>

        @if($fields->isNotEmpty())
            <div class="flex flex-wrap justify-center items-center gap-2 mb-10 max-w-xl mx-auto bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
                <button onclick="filterFields('all')" id="btn-filter-all" class="filter-btn text-xs font-bold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer bg-emerald-600 text-white shadow-2xs">
                    🌟 Tất cả sân
                </button>
                @php
                    // Thu thập danh sách các loại sân duy nhất hiện có trong cụm sân này
                    $uniqueTypes = $fields->pluck('fieldType')->unique('id')->filter();
                @endphp
                @foreach($uniqueTypes as $type)
                    <button onclick="filterFields('type-{{ $type->id }}')" id="btn-filter-type-{{ $type->id }}" class="filter-btn text-xs font-bold px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-200 cursor-pointer">
                        {{ $type->name }}
                    </button>
                @endforeach
            </div>
        @endif
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto" id="fields-container">
            @forelse($fields as $field)
                <div class="field-card bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs hover:border-emerald-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                     data-type-id="type-{{ $field->field_type_id }}">
                    
                    @if($field->specialEvents->isNotEmpty())
                        <div class="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-xs tracking-wider animate-pulse z-10">
                            🔥 Sự kiện đặc biệt
                        </div>
                    @endif

                    <div>
                        <div class="w-12 h-12 bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg rounded-xl mb-4">🌱</div>
                        <h3 class="text-lg font-bold text-slate-950 mb-1">{{ $field->name }}</h3>
                        
                        <p class="text-xs text-slate-500 mb-2">
                            Loại sân: <span class="font-medium text-slate-700">{{ $field->fieldType->name ?? 'Sân tiêu chuẩn hệ thống' }}</span>
                        </p>
                        
                        @if($field->description)
                            <p class="text-xs text-slate-400 italic line-clamp-2 mb-3">{{ $field->description }}</p>
                        @endif

                        @if($field->specialEvents->isNotEmpty())
                            <div class="mt-2 p-2.5 bg-rose-50 border border-rose-100 rounded-xl space-y-1">
                                @foreach($field->specialEvents as $event)
                                    <p class="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                                        📢 {{ $event->title ?? 'Sự kiện hệ thống' }}
                                    </p>
                                    <p class="text-[10px] text-rose-500">
                                        ⏱️ Ca áp dụng: {{ \Carbon\Carbon::parse($event->start_time)->format('H:i') }}
                                    </p>
                                    @if($event->effect === 'surge' && $event->surge_percent)
                                        <p class="text-[10px] text-amber-600 font-semibold">
                                            📈 Cấu hình: Phụ thu +{{ $event->surge_percent }}% khung giờ vàng
                                        </p>
                                    @endif
                                @endforeach
                            </div>
                        @endif
                    </div>

                    <div class="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between gap-2">
                        @if($field->specialEvents->isNotEmpty())
                            <span class="text-[10px] sm:text-[11px] bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                                Đang có sự kiện
                            </span>
                        @else
                            <span class="text-[10px] sm:text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                                Đang hoạt động
                            </span>
                        @endif
                        
                        <a href="{{ route('tenant.public.schedule', ['slug' => $tenant->slug, 'field_id' => $field->id]) }}" 
                           class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-sm whitespace-nowrap shrink-0 inline-flex items-center gap-1">
                            Xem lịch trống 
                        </a>
                    </div>
                </div>
            @empty
                <div class="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xs hover:border-emerald-500 transition-all duration-200 col-span-3 text-center py-12">
                    <div class="w-12 h-12 bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg rounded-xl mb-4 mx-auto">⚠️</div>
                    <h3 class="text-lg font-bold text-slate-950 mb-1">Chưa có sân nào được cấu hình</h3>
                    <p class="text-xs text-slate-500 mb-4">Chủ bãi sân chưa thiết lập cấu hình danh sách sân nhỏ.</p>
                    <a href="#" class="bg-slate-200 text-slate-400 font-bold text-xs px-4 py-2 rounded-xl cursor-not-allowed inline-block">Xem lịch trống</a>
                </div>
            @endforelse
        </div>

        <div id="no-fields-alert" class="hidden bg-white border border-slate-200 p-12 rounded-2xl shadow-2xs text-center max-w-4xl mx-auto col-span-3">
            <div class="w-12 h-12 bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg rounded-xl mb-4 mx-auto">🔍</div>
            <h3 class="text-base font-bold text-slate-950 mb-1">Không tìm thấy sân phù hợp</h3>
            <p class="text-xs text-slate-400">Bãi hiện tại không có cụm sân nào thuộc nhóm danh mục này.</p>
        </div>
    </main>

    <footer class="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        <p class="font-bold text-slate-600">Hệ thống vận hành độc lập bởi hạ tầng đa chủ thể MTSFMS SaaS</p>
        <p class="mt-1">© 2026 Bản quyền thuộc về không gian quản trị {{ $tenant->name }}.</p>
    </footer>

    <script>
        function filterFields(typeId) {
            const cards = document.querySelectorAll('.field-card');
            const buttons = document.querySelectorAll('.filter-btn');
            let visibleCount = 0;


            buttons.forEach(btn => {
                btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-2xs');
                btn.classList.add('text-slate-600', 'hover:text-slate-900', 'hover:bg-white/60');
            });

            const activeBtn = document.getElementById(`btn-filter-${typeId}`);
            if (activeBtn) {
                activeBtn.classList.remove('text-slate-600', 'hover:text-slate-900', 'hover:bg-white/60');
                activeBtn.classList.add('bg-emerald-600', 'text-white', 'shadow-2xs');
            }

          
            cards.forEach(card => {
                if (typeId === 'all' || card.getAttribute('data-type-id') === typeId) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

  
            const alertBox = document.getElementById('no-fields-alert');
            if (visibleCount === 0) {
                alertBox.classList.remove('hidden');
            } else {
                alertBox.classList.add('hidden');
            }
        }
    </script>
    </body>
</html>