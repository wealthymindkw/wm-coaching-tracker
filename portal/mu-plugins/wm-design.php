<?php
/**
 * Plugin Name: WM Design
 * Description: نظام تصميم بوابة Wealthy Mind — هيدر أبيض، بانر عنوان كحلي بنمط سداسيات، قائمة برنامج جانبية، وصفحة دخول مقسومة متجاوبة.
 */

if (!defined('ABSPATH')) exit;

define('WM_PROGRAM_ROOT', 20);

/* ---------- الخط ---------- */
add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style('wm-tajawal', 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap', array(), null);
}, 5);

/* ---------- الشعار + اسم الموقع في الهيدر ---------- */
add_filter('generate_site_title_output', function () {
    $logo = esc_url(home_url('/wp-content/uploads/2026/07/wm-logo-150x150.png'));
    $home = esc_url(home_url('/'));
    return '<p class="main-title wm-brand"><a href="' . $home . '" rel="home">'
        . '<img src="' . $logo . '" alt="Wealthy Mind" width="44" height="44" />'
        . '<span>Wealthy Mind</span></a></p>';
});

/* ---------- بانر عنوان الصفحة (كحلي + نمط سداسيات) ---------- */
add_filter('generate_show_title', '__return_false');

add_action('generate_after_header', function () {
    if (is_admin() || !is_page()) return;
    echo '<div class="wm-hero"><div class="wm-hero-in">'
        . '<span class="wm-hero-k">WEALTHY MIND</span>'
        . '<h1>' . esc_html(get_the_title()) . '</h1>'
        . '</div></div>';
}, 15);

/* ---------- القائمة الجانبية داخل البرنامج (root = 20) ---------- */
function wm_in_program($id) {
    if ((int) $id === WM_PROGRAM_ROOT) return true;
    return in_array(WM_PROGRAM_ROOT, get_post_ancestors($id), true);
}

function wm_chev() {
    return '<svg class="wm-chev" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">'
        . '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function wm_pages_sorted($parent) {
    $pages = get_pages(array('parent' => $parent, 'sort_column' => 'menu_order', 'hierarchical' => 0));
    if (!$pages) return array();
    usort($pages, function ($a, $b) {
        if ($a->menu_order !== $b->menu_order) return $a->menu_order - $b->menu_order;
        return $a->ID - $b->ID;
    });
    return $pages;
}

function wm_prognav($current) {
    $root      = WM_PROGRAM_ROOT;
    $ancestors = get_post_ancestors($current);
    $html      = '<nav class="wm-prognav" aria-label="أقسام البرنامج">';

    $cls   = ($current === $root) ? ' is-active' : '';
    $html .= '<a class="wm-top' . $cls . '" href="' . esc_url(get_permalink($root)) . '">' . wm_chev()
        . '<span>الصفحة الرئيسية للبرنامج</span></a>';

    foreach (wm_pages_sorted($root) as $sec) {
        $open  = ($current === $sec->ID) || in_array($sec->ID, $ancestors, true);
        $html .= '<div class="wm-acc' . ($open ? ' is-open' : '') . '">';
        $html .= '<button type="button" class="wm-acc-h" aria-expanded="' . ($open ? 'true' : 'false') . '">'
            . wm_chev() . '<span>' . esc_html(get_the_title($sec)) . '</span></button>';
        $html .= '<div class="wm-acc-p">';
        foreach (wm_pages_sorted($sec->ID) as $les) {
            $cls   = ($current === $les->ID) ? ' class="is-active"' : '';
            $html .= '<a href="' . esc_url(get_permalink($les)) . '"' . $cls . '>' . wm_chev()
                . '<span>' . esc_html(get_the_title($les)) . '</span></a>';
        }
        $html .= '</div></div>';
    }
    $html .= '</nav>';
    $html .= '<script>document.querySelectorAll(".wm-prognav .wm-acc-h").forEach(function(b){'
        . 'b.addEventListener("click",function(){var w=b.parentNode,o=w.classList.toggle("is-open");'
        . 'b.setAttribute("aria-expanded",o?"true":"false");});});</script>';
    return $html;
}

/* كلاس على body داخل شجرة البرنامج — لفك قيد عرض wm-clean-layout */
add_filter('body_class', function ($classes) {
    if (is_page() && wm_in_program(get_the_ID())) $classes[] = 'wm-program';
    return $classes;
});

add_filter('the_content', function ($content) {
    if (is_admin() || !is_page() || !in_the_loop() || !is_main_query()) return $content;
    $id = get_the_ID();
    if (!wm_in_program($id)) return $content;
    return '<div class="wm-layout"><main class="wm-main">' . $content . '</main>'
        . '<aside class="wm-side">' . wm_prognav($id) . '</aside></div>';
}, 20);

/* ---------- CSS الواجهة ---------- */
add_action('wp_head', function () { ?>
<style id="wm-design-css">
:root{--wm-navy:#0B1F3A;--wm-gold:#C9A227;--wm-blue:#16406e;--wm-line:#e5e7eb;--wm-ink:#1f2937;--wm-mut:#6b7280}
body{font-family:'Tajawal',sans-serif;color:var(--wm-ink);background:#fff}

/* الهيدر — أبيض نظيف */
.site-header{background:#fff !important;border-bottom:1px solid var(--wm-line)}
.site-header .inside-header{display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:1280px;margin:0 auto;padding:14px 32px !important}
.wm-brand{margin:0}
.wm-brand a{display:flex;align-items:center;gap:12px;text-decoration:none}
.wm-brand img{width:44px;height:44px;display:block;border-radius:50%}
.wm-brand span{color:var(--wm-navy);font-weight:800;font-size:1.3rem;letter-spacing:.2px;line-height:1;white-space:nowrap}
.site-description{display:none}

/* القائمة الرئيسية — روابط كحلية على أبيض */
.main-navigation,.main-navigation ul ul{background:#fff !important}
.main-navigation{border-bottom:1px solid var(--wm-line)}
.site-header .main-navigation{border-bottom:0}
.main-navigation .main-nav ul li a,.menu-bar-items,.menu-bar-items a{color:var(--wm-navy) !important;font-weight:600;font-size:.98em}
.main-navigation .main-nav ul li a:hover,.main-navigation .main-nav ul li.sfHover > a,
.main-navigation .main-nav ul li[class*="current"] > a{color:var(--wm-gold) !important;background:transparent !important}
.main-navigation .main-nav ul li[class*="current"] > a{box-shadow:inset 0 -3px 0 var(--wm-gold)}
.main-navigation .menu-toggle,.main-navigation .menu-toggle:hover,
.main-navigation.toggled .main-nav > ul{background:#fff !important;color:var(--wm-navy) !important}
button.menu-toggle{color:var(--wm-navy) !important}

/* زر الدخول/الخروج في الهيدر */
.wm-auth a{display:inline-block;border:1.5px solid var(--wm-navy);border-radius:8px;padding:6px 18px;line-height:1.4;font-weight:700;transition:all .15s ease}
.wm-auth a:hover{background:var(--wm-navy);color:#fff !important}

/* بانر العنوان — كحلي بنمط سداسيات */
.wm-hero{background-color:var(--wm-navy);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/svg%3E");background-size:84px 147px}
.wm-hero-in{max-width:1280px;margin:0 auto;padding:32px 32px 30px}
.wm-hero-k{display:block;color:var(--wm-gold);font-size:.72rem;font-weight:700;letter-spacing:4px;margin:0 0 6px}
.wm-hero h1{color:#fff;font-size:1.6rem;font-weight:800;letter-spacing:.4px;margin:0;line-height:1.35}

/* المحتوى */
.site-content{max-width:1280px;margin:0 auto;padding:38px 32px 64px}
.entry-header{display:none}

/* تخطيط البرنامج: محتوى + قائمة جانبية */
body.wm-program .site-main{max-width:1160px !important;margin:0 auto !important}
.wm-main > div[style]{max-width:none !important;margin:0 !important}
.wm-layout{display:flex;gap:44px;align-items:flex-start}
.wm-main{flex:1 1 auto;min-width:0}
.wm-side{flex:0 0 300px;max-width:300px;position:sticky;top:24px}

/* القائمة الجانبية — أكورديون */
.wm-prognav{border-top:2px solid var(--wm-line)}
.wm-prognav a,.wm-prognav .wm-acc-h{display:flex;align-items:center;gap:9px;width:100%;box-sizing:border-box;padding:13px 4px;margin:0;border:0;border-bottom:1px solid var(--wm-line);border-radius:0;background:none;color:var(--wm-navy);text-decoration:none;font-weight:600;font-size:.94em;line-height:1.5;cursor:pointer;text-align:right;font-family:inherit;transition:color .12s ease}
.wm-prognav a:hover,.wm-prognav .wm-acc-h:hover{color:var(--wm-gold);background:none}
.wm-prognav a.is-active{color:var(--wm-blue);font-weight:800}
.wm-prognav .wm-chev{flex:0 0 auto;color:var(--wm-gold);transition:transform .18s ease}
.wm-acc.is-open > .wm-acc-h .wm-chev{transform:rotate(-90deg)}
.wm-acc-p{display:none}
.wm-acc.is-open .wm-acc-p{display:block}
.wm-acc-p a{padding-right:30px;font-weight:500;font-size:.88em;background:#fafbfc}

/* بانرات صفحة البرامج */
.wm-banner{transition:transform .15s ease,box-shadow .15s ease}
a.wm-banner:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(11,31,58,.28) !important}

@media (max-width:920px){
  .wm-layout{flex-direction:column;gap:34px}
  .wm-side{flex:1 1 auto;max-width:none;width:100%;position:static}
  .site-content{padding:26px 18px 48px}
  .wm-hero-in{padding:24px 18px}
  .site-header .inside-header{padding:12px 18px !important}
}
</style>
<?php }, 20);

/* ==================================================================
 * صفحة الدخول — تصميم مقسوم: الفورم يمين + لوحة تعريفية يسار
 * وعلى الموبايل: اللوحة تنزل تحت الفورم (بدون اختفاء)
 * ================================================================== */

add_filter('login_headerurl', function () { return home_url('/'); });

add_filter('login_headertext', function () {
    $logo = esc_url(home_url('/wp-content/uploads/2026/07/wm-logo-300x300.png'));
    return '<img src="' . $logo . '" alt="Wealthy Mind" /><span>بوابة Wealthy Mind</span>';
});

add_filter('login_display_language_dropdown', '__return_false');

add_action('login_enqueue_scripts', function () { ?>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<style id="wm-login-css">
html{height:auto !important}
body.login{font-family:'Tajawal',sans-serif !important;background:#f4f5f7 !important;margin:0;min-height:100vh}

/* عمود الفورم — أبيض ثابت على اليمين */
#login{position:fixed;top:0;right:0;bottom:0;left:auto;width:min(460px,100vw);margin:0 !important;padding:7vh 48px 40px !important;background:#fff;box-shadow:-14px 0 36px rgba(11,31,58,.09);overflow-y:auto;z-index:10;box-sizing:border-box}
.login h1.wp-login-logo a,.login h1 a{background:none !important;text-indent:0 !important;width:auto !important;height:auto !important;display:flex;flex-direction:column;align-items:center;gap:14px;font-family:'Tajawal',sans-serif !important;font-size:1.45rem !important;font-weight:800 !important;color:#0B1F3A !important;line-height:1.3 !important;text-decoration:none}
.login h1 a img{width:86px;height:86px;display:block}

.login form{border:none !important;box-shadow:none !important;padding:0 !important;margin-top:26px;background:transparent !important}
.login label{font-weight:700;color:#0B1F3A;font-size:.95em}
.login input[type=text],.login input[type=password]{border-radius:10px !important;border:1.5px solid #d1d5db !important;padding:10px 12px !important;font-size:1em !important;background:#fff}
.login input:focus{border-color:#C9A227 !important;box-shadow:0 0 0 2px rgba(201,162,39,.22) !important;outline:none}
.wp-core-ui .button-primary{background:#C9A227 !important;border:none !important;color:#0B1F3A !important;font-weight:800 !important;border-radius:10px !important;padding:9px 26px !important;width:100%;margin-top:14px;float:none !important;text-shadow:none !important;font-size:1.02em !important;transition:filter .15s ease}
.wp-core-ui .button-primary:hover{filter:brightness(1.06)}
.login #login_error,.login .message,.login .success{border-radius:10px;border-right-width:4px}
.login #nav{text-align:center;margin-top:18px}
.login #nav a{color:#16406e !important;font-weight:600}
.login #backtoblog{display:none}
.language-switcher{display:none !important}

/* اللوحة التعريفية — يسار الشاشة */
.wm-promo{position:fixed;top:0;bottom:0;left:0;right:min(460px,100vw);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:48px;background:#f4f5f7;text-align:center;box-sizing:border-box;z-index:1}
.wm-promo-card{background:#fff;border:1.5px solid #C9A227;border-radius:4px;padding:52px 46px;max-width:540px;width:100%;box-shadow:0 10px 34px rgba(11,31,58,.07);box-sizing:border-box}
.wm-promo-kicker{display:block;color:#C9A227;font-size:.75rem;font-weight:700;letter-spacing:5px;margin:0 0 14px}
.wm-promo-card h2{color:#0B1F3A;font-size:1.75rem;font-weight:800;margin:0 0 12px;line-height:1.4;font-family:'Tajawal',sans-serif}
.wm-promo-card p{color:#6b7280;font-size:1.02rem;margin:0;line-height:1.9}
.wm-promo-note{color:#4b5563;font-size:.95rem;margin:0}
.wm-promo-note strong{color:#0B1F3A}

/* الموبايل: اللوحة تنزل تحت الفورم بدل الاختفاء */
@media (max-width:860px){
  #login{position:static;width:100%;min-height:0;padding:52px 26px 36px !important;box-shadow:none}
  .wm-promo{position:static;padding:42px 22px 60px;border-top:1px solid #e5e7eb}
}
</style>
<?php });

add_action('login_footer', function () { ?>
<div class="wm-promo">
  <div class="wm-promo-card">
    <span class="wm-promo-kicker">WEALTHY MIND</span>
    <h2>بوابة عملاء Wealthy Mind</h2>
    <p>محتوى برنامجك، تدريباتك، وأدواتك — في مكان واحد.</p>
  </div>
  <p class="wm-promo-note">لست عضواً بعد؟ تواصل مع فريق <strong>Wealthy Mind</strong> للانضمام إلى برامجنا.</p>
</div>
<?php });
