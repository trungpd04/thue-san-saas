<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTSFMS - Nền Tảng Quản Lý Chuỗi Sân Thể Thao Tự Động Toàn Diện (SaaS)</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>
        .scroll-smooth {
            scroll-behavior: smooth;
        }
    </style>
</head>

<body class="bg-slate-50 text-slate-900 antialiased scroll-smooth">

    <header class="bg-white/90 backdrop-blur-md border-b border-slate-200/80 fixed top-0 w-full z-50 shadow-xs">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <span class="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                ⚽ MTSFMS <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">SaaS B2B</span>
            </span>
            <nav class="hidden md:flex space-x-8 font-semibold text-slate-600 text-sm">
                <a href="#hero" class="hover:text-emerald-600 transition-colors">Trang Chủ</a>
                <a href="#features" class="hover:text-emerald-600 transition-colors">Tính Năng Cốt Lõi</a>
                <a href="#workflow" class="hover:text-emerald-600 transition-colors">Quy Trình Vận Hành</a>
                <a href="#pricing" class="hover:text-emerald-600 transition-colors">Bảng Giá Dịch Vụ</a>
                <a href="#stats" class="hover:text-emerald-600 transition-colors">Số Liệu Thống Kê</a>
            </nav>
            <a href="#pricing" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition cursor-pointer text-sm">
                Dùng Thử Miễn Phí
            </a>
        </div>
    </header>

    <section id="hero" class="pt-36 pb-24 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border-b border-slate-100">
        <div class="max-w-5xl mx-auto text-center px-4">
            <span class="text-emerald-700 bg-emerald-100/80 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider inline-block mb-4 shadow-2xs">
                🚀 Giải Pháp Chuyển Đổi Số Ngành Thể Thao Đột Phá
            </span>
            <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 mb-6 leading-tight">
                Tự động hóa bãi sân của bạn <br>
                <span class="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Nhân đôi doanh thu, giảm 90% công sức</span>
            </h1>
            <p class="text-lg text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                MTSFMS cung cấp hệ thống hạ tầng SaaS Cloud đồng bộ giúp các chủ sân bóng, sân tennis, cầu lông tối ưu hóa lịch đặt bãi trực tuyến, tự động quét mã QR thanh toán và quản lý nhân viên trực ca chặt chẽ.
            </p>
            <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="#pricing" class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all cursor-pointer text-center">
                    Xem Bảng Giá Khởi Tạo
                </a>
                <a href="#features" class="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold px-8 py-4 rounded-xl transition cursor-pointer text-center">
                    Khám Phá Tính Năng ⚙️
                </a>
            </div>
        </div>
    </section>

    <div class="max-w-4xl mx-auto px-4 mt-8">
        @if ($errors->any())
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-xs animate-pulse">
            <h3 class="text-sm font-bold text-red-800 flex items-center gap-2">❌ Thông tin đăng ký doanh nghiệp chưa hợp lệ:</h3>
            <ul class="mt-2 list-disc list-inside text-sm text-red-700 space-y-1 pl-2">
                @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
        @endif
    </div>

    <main>
        <section id="features" class="py-24 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-20">
                    <h2 class="text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Tính Năng Vượt Trội Của Hệ Thống</h2>
                    <p class="mt-4 text-slate-500 max-w-xl mx-auto text-sm sm:text-base">Chúng tôi đóng gói toàn bộ nghiệp vụ quản lý bãi thể thao phức tạp vào một nền tảng tinh gọn độc lập.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    <div class="p-8 rounded-2xl border border-slate-200/60 bg-slate-50/30 hover:border-emerald-500 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                        <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">📅</div>
                        <h3 class="text-xl font-bold text-slate-900 mb-3">Hạ tầng Cấp Phát Khách Thuê (Tenant Booking Page)</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Mỗi chủ sân bóng sau khi đăng ký sẽ sở hữu ngay một trang đặt lịch công khai riêng biệt dành cho người chơi (Cầu thủ, khách đá phủi) vào tra cứu ca trống trực tuyến.
                        </p>
                    </div>
                    <div class="p-8 rounded-2xl border border-slate-200/60 bg-slate-50/30 hover:border-emerald-500 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                        <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">💸</div>
                        <h3 class="text-xl font-bold text-slate-900 mb-3">Tự Động Quét Mã Nhận Cọc Qua Ngân Hàng</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Tích hợp cơ chế Webhook cổng ngân hàng thông minh. Người chơi chuyển khoản cọc, hệ thống tự động xác minh nội dung giao dịch và phê duyệt giữ lịch ngay trong 3 giây.
                        </p>
                    </div>
                    <div class="p-8 rounded-2xl border border-slate-200/60 bg-slate-50/30 hover:border-emerald-500 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                        <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">👥</div>
                        <h3 class="text-xl font-bold text-slate-900 mb-3">Phân Quyền Vận Hành & Đặt Hộ Khách</h3>
                        <p class="text-slate-600 text-sm leading-relaxed">
                            Hệ thống cung cấp không gian quản trị Filament hành chính cho nhân viên trực bãi dễ dàng tạo đơn đặt hộ cho những khách hàng đặt sân qua Hotline, Zalo hoặc đối chiếu ca.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <section id="workflow" class="py-20 bg-slate-100/60 border-y border-slate-200/60">
            <div class="max-w-6xl mx-auto px-4">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-black text-slate-900 tracking-tight">Quy Trình Hoạt Động Khép Kín</h2>
                    <p class="mt-3 text-slate-500 text-sm">Hệ thống xử lý phân tách rõ ràng dữ liệu để đảm bảo tính an toàn bảo mật đa luồng.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center">
                        <div class="text-xs font-bold text-emerald-600 uppercase mb-2">Bước 1</div>
                        <h4 class="font-bold text-slate-900 mb-2">Chọn Gói Phần Mềm</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">Chủ bãi sân truy cập hệ thống tổng SaaS xem cấu hình giới hạn bãi và nhân sự.</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center">
                        <div class="text-xs font-bold text-emerald-600 uppercase mb-2">Bước 2</div>
                        <h4 class="font-bold text-slate-900 mb-2">Khởi Tạo Doanh Nghiệp</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">Điền thông tin chuỗi bãi để hệ thống tự động sinh dữ liệu định danh riêng biệt.</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center">
                        <div class="text-xs font-bold text-emerald-600 uppercase mb-2">Bước 3</div>
                        <h4 class="font-bold text-slate-900 mb-2">Cấp Trang Đặt Lịch</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">Hệ thống kích hoạt trang Đặt Sân Công Khai để khách hàng vãng lai tìm kiếm ca đá trống.</p>
                    </div>
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs text-center">
                        <div class="text-xs font-bold text-emerald-600 uppercase mb-2">Bước 4</div>
                        <h4 class="font-bold text-slate-900 mb-2">Vận Hành Dashboard</h4>
                        <p class="text-xs text-slate-500 leading-relaxed">Đăng nhập cổng Admin Filament kiểm soát lịch sử đặt sân và duyệt báo cáo tài chính.</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="pricing" class="py-24 bg-slate-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-3xl font-black text-slate-900 sm:text-4xl tracking-tight">Bảng Giá Đăng Ký Bản Quyền SaaS</h2>
                    <p class="mt-4 text-slate-500 text-sm">Hệ thống cấp tài nguyên phân quyền tự động ngay sau khi khởi tạo form dữ liệu.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
                    @foreach($plans as $plan)
                    <div class="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between relative group hover:border-emerald-500 hover:shadow-xl transition-all duration-300">
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{{ $plan->name }}</h3>
                                @if($plan->price_monthly > 500000)
                                <span class="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">Doanh nghiệp</span>
                                @endif
                            </div>
                            <div class="my-6 flex items-baseline">
                                <span class="text-4xl font-black tracking-tight text-slate-950">{{ number_format($plan->price_monthly) }}</span>
                                <span class="text-slate-500 font-semibold ml-2 text-sm">đ / tháng</span>
                            </div>
                            <hr class="border-slate-100 my-5">
                            <ul class="text-sm text-slate-600 space-y-4 mb-8">
                                <li class="flex items-center gap-3">
                                    <span class="text-emerald-500 font-black text-base">✓</span> Hạ tầng quản trị: <strong class="text-slate-900 font-bold">Tối đa {{ $plan->max_fields }} cụm sân mini</strong>
                                </li>
                                <li class="flex items-center gap-3">
                                    <span class="text-emerald-500 font-black text-base">✓</span> Nhân viên vận hành: <strong class="text-slate-900 font-bold">Giới hạn {{ $plan->max_staff }} nhân sự</strong>
                                </li>
                                <li class="flex items-center gap-3 text-slate-500">
                                    <span class="text-emerald-500 font-black text-base">✓</span> Tích hợp kết nối cổng thanh toán ngân hàng tự động
                                </li>
                                <li class="flex items-center gap-3 text-slate-500">
                                    <span class="text-emerald-500 font-black text-base">✓</span> Sao lưu dữ liệu Database đám mây tự động hàng ngày
                                </li>
                            </ul>
                        </div>
                        <button onclick="openModal('{{ $plan->id }}', '{{ $plan->name }}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md group-hover:scale-[1.01] transition-all cursor-pointer text-center text-sm tracking-wide">
                            Khởi Tạo Hệ Thống Ngay
                        </button>
                    </div>
                    @endforeach
                </div>
            </div>
        </section>

        <section id="stats" class="py-20 bg-emerald-950 text-white">
            <div class="max-w-6xl mx-auto px-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div class="text-4xl font-black text-emerald-400 mb-2">150+</div>
                        <div class="text-xs uppercase text-emerald-200 font-bold tracking-wider">Bãi Sân Kích Hoạt</div>
                    </div>
                    <div>
                        <div class="text-4xl font-black text-emerald-400 mb-2">500,000+</div>
                        <div class="text-xs uppercase text-emerald-200 font-bold tracking-wider">Trận Đấu Đã Đặt</div>
                    </div>
                    <div>
                        <div class="text-4xl font-black text-emerald-400 mb-2">99.9%</div>
                        <div class="text-xs uppercase text-emerald-200 font-bold tracking-wider">Thời Gian Uptime Cloud</div>
                    </div>
                    <div>
                        <div class="text-4xl font-black text-emerald-400 mb-2">24/7</div>
                        <div class="text-xs uppercase text-emerald-200 font-bold tracking-wider">Hỗ Trợ Kỹ Thuật Đồ Án</div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="bg-slate-950 text-slate-500 py-12 border-t border-slate-900">
        <div class="max-w-7xl mx-auto px-4 text-center text-xs space-y-2">
            <p class="text-slate-400 font-bold">MTSFMS - Automated Sports Field Management System (SaaS)</p>
            <p>© 2026 Toàn bộ bản quyền sản phẩm thuộc về Nhóm Phát Triển Đồ Án Tốt Nghiệp Công Nghệ Thông Tin.</p>
        </div>
    </footer>

    <div id="registerModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center hidden z-50 p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <button onclick="closeModal()" type="button" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>

            <h3 class="text-xl font-black text-slate-950 tracking-tight">Đăng Ký Thuê Không Gian Hệ Thống</h3>
            <p class="text-xs text-emerald-600 font-bold mt-1 mb-6 flex items-center gap-1">
                📌 Gói lựa chọn cấu hình: <span id="selectedPlan" class=" decoration-wavy font-black"></span>
            </p>

            <form action="{{ route('saas.register_tenant') }}" method="POST" class="space-y-4 text-left">
                @csrf
                <input type="hidden" name="plan_id" id="plan_id_input">

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Tên Chuỗi Sân / Tên Doanh Nghiệp</label>
                    <input type="text" name="company_name" value="{{ old('company_name') }}" required placeholder="Ví dụ: Tổ hợp Sân Bóng Hoàng Duy Hà Nội" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Họ Tên Chủ Quản Trị Hệ Thống</label>
                    <input type="text" name="name" value="{{ old('name') }}" required placeholder="Ví dụ: Nguyen Van A" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Địa Chỉ Email Đăng Nhập Hệ Thống</label>
                    <input type="email" name="email" value="{{ old('email') }}" required placeholder="name@example.com" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Số Điện Thoại Bãi Sân</label>
                    <input type="text" name="company_phone" value="{{ old('company_phone') }}" required placeholder="Ví dụ: 0987654321" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Địa Chỉ Bãi Sân</label>
                    <input type="text" name="company_address" value="{{ old('company_address') }}" required placeholder="Ví dụ: Số 123 Đường Kim Đồng, Hoàng Mai, Hà Nội" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Mật Khẩu Đăng Nhập Quản Trị</label>
                    <input type="password" name="password" required placeholder="Nhập tối thiểu từ 8 ký tự bảo mật" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div>
                    <label class="block text-xs font-bold uppercase text-slate-700 mb-1 tracking-wider">Xác Nhận Lại Mật Khẩu</label>
                    <input type="password" name="password_confirmation" required placeholder="Yêu cầu nhập trùng khớp mật khẩu trên" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-sm">
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="button" onclick="closeModal()" class="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition cursor-pointer text-sm">Hủy Bỏ</button>
                    <button type="submit" class="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition cursor-pointer text-sm text-center">Xác Nhận Khởi Tạo</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Hàm bắt sự kiện click từ nút Chọn Gói của từng Plan và đổ data động vào form
        function openModal(id, name) {
            document.getElementById('plan_id_input').value = id;
            document.getElementById('selectedPlan').innerText = name;
            document.getElementById('registerModal').classList.remove('hidden');
        }

        // Hàm ẩn modal đăng ký khi bấm hủy hoặc dấu x
        function closeModal() {
            document.getElementById('registerModal').classList.add('hidden');
        }
    </script>
</body>

</html>