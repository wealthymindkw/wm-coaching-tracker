<?php
/**
 * Plugin Name: WM Login Button
 * Description: زر دخول/خروج ديناميكي في الهيدر (hook: generate_menu_bar_items).
 */

if (!defined('ABSPATH')) exit;

add_action('generate_menu_bar_items', function () {
    if (is_user_logged_in()) {
        $url   = wp_logout_url(home_url('/'));
        $label = 'تسجيل الخروج';
    } else {
        $url   = wp_login_url(home_url('/'));
        $label = 'تسجيل الدخول';
    }
    echo '<span class="menu-bar-item wm-auth"><a href="' . esc_url($url) . '">' . esc_html($label) . '</a></span>';
});
