<?php
/**
 * Plugin Name: WM ZZ Overrides
 * Description: تصحيحات نهائية تُحمّل أخيراً — توسيط المحتوى، إخفاء الشريط الجانبي للثيم، وشفافية شريط التنقل.
 */

if (!defined('ABSPATH')) exit;

add_action('wp_head', function () { ?>
<style id="wm-zz-css">
/* شريط التنقل داخل الهيدر يبقى شفافاً على الخلفية البيضاء */
.site-header .main-navigation{background:transparent !important}

/* إخفاء الشريط الجانبي الافتراضي للثيم وتوسيع المحتوى */
#right-sidebar,#left-sidebar{display:none !important}
.content-area,#primary{width:100% !important;float:none !important;margin:0 auto}

/* إزالة أي هوامش زائدة حول المقال */
.separate-containers .inside-article{padding:0;background:transparent}
.separate-containers .site-main{margin:0}
article .entry-content{margin-top:0}
</style>
<?php }, 99);
