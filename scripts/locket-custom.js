/* Locket Custom v1.0 — personal modification of usatalk/nca + usatalk/my-script.
 * Original preset attribution: nguyencongan; DINH DUY VINH 09 (upstream comment).
 * Offline rewrite only. No HTTP client, remote import, credential storage or logging.
 * Schema inherited from the supplied script is NOT validated against a live Locket app.
 */
var SETTINGS = {
  enabled: true,
  debug: false,
  goldResponseOverride: true, // Local response only; does not buy or activate server-side Gold.
  videoSeconds: 45,
  maxUploadMiB: 100,
  videoMbps: 0.6,
  maxFriends: 999999,
  hideAds: true,
  disableSentry: true,
  enableFeatureFlags: true,
  enableCameraOptions: true,
  enableSocialOptions: true,
  enableInterfaceOptions: true,
  includeOriginalCaptions: true,
  includeOriginalFilters: true,
  purchaseDate: '2026-11-03T00:00:00Z',
  expiresDate: '2099-12-31T23:59:59Z',
  // Empty = preserve the server's widget frame. Only HTTPS image URLs are accepted.
  widgetFrameImageURL: '',
  widgetFramePlacement: 'below',
  customCaptions: [
    {id:'nien_coffee',text:'Một chút cà phê',emoji:'☕',colors:['#3B2419','#9D7353'],color:'#FFFFFF'},
    {id:'nien_little_moments',text:'Những điều nhỏ xíu',emoji:'✨',colors:['#F4E9DA','#E9D4BB'],color:'#463C32'},
    {id:'nien_film',text:'Một ngày trên phim',emoji:'🎞️',colors:['#191919','#46403B'],color:'#FAEBCF'},
    {id:'nien_pink',text:'Hôm nay thật dịu dàng',emoji:'🌷',colors:['#FFD7E6','#F5A8C5'],color:'#6B2845'},
    {id:'nien_date',text:'Hẹn nhau ở đây',emoji:'🤍',colors:['#EDE6FF','#C9B8EB'],color:'#503B73'},
    {id:'nien_sky',text:'Để gió mang đi',emoji:'☁️',colors:['#D7F0FF','#AACDEB'],color:'#244C70'},
    {id:'nien_work',text:'Đang tập trung',emoji:'💻',colors:['#17352D','#3D6F57'],color:'#E7F1DA'},
    {id:'nien_weekend',text:'Cuối tuần của mình',emoji:'🌼',colors:['#FFF0AB','#FFC875'],color:'#65421D'},
    {id:'nien_home',text:'Về nhà thôi',emoji:'🏠',colors:['#EFE5D7','#D5B99D'],color:'#53412D'},
    {id:'nien_night',text:'Một tối thật yên',emoji:'🌙',colors:['#172338','#4A567A'],color:'#E9E5D4'},
    {id:'nien_trip',text:'Thêm một chuyến đi',emoji:'✈️',colors:['#B8E4DD','#75B7AB'],color:'#254D48'},
    {id:'nien_booth',text:'Giữ lại khoảnh khắc',emoji:'📸',colors:['#FFF5E7','#F3D4AC'],color:'#593D2C'}
  ]
};

/* Presets from the inspected upstream snapshot. No runtime fetch is performed. */
var PRESETS = {
  "entries": {"android_subscribe_gold_button_enabled":"false","profile_badge_visible":"true","lunar_new_year_app_icon_enabled":"true","history_ads_mode":"off","history_ads_prefetch_count":"0","history_ads_prefetch_immediate":"false","history_ads_prefetch_reroute":"false","history_ads_dynamic_insertion":"false","history_ads_refresh_prefetch_on_foreground":"false","history_ads_floor_price":"0","history_ads_floor_price_att":"0","history_ad_log_displayed_on_background":"false","history_ads_debug_menu":"false","sentry_sample_rate":"0","sentry_network_tracing":"false","sentry_performance_tracking":"false","sentry_trace_sample_rate":"0","sentry_profiles_sample_rate":"0","camera":"{\"gold_max_duration\":45,\"goldMaxDuration\":45,\"max_duration\":45,\"maxDuration\":45,\"ultra_wide\":true,\"ultraWide\":true,\"volume_button\":true,\"volumeButton\":true,\"flash_button\":true,\"telephoto\":true,\"srgb\":true,\"lanczos\":true,\"quality_mbps\":0.6,\"qualityMbps\":0.6}","camera_roll":"{\"gold_max_duration\":45,\"goldMaxDuration\":45,\"video_max_duration\":45,\"videoMaxDuration\":45,\"max_duration\":45,\"maxDuration\":45,\"trim_max_duration\":45,\"trimMaxDuration\":45,\"camera_roll_max_duration\":45,\"camera_roll_video_max_duration\":45,\"max_file_size\":104857600,\"max_upload_bytes\":104857600,\"max_size_bytes\":104857600,\"quality_mbps\":0.6,\"qualityMbps\":0.6,\"flash_button\":true}","live_photos":"{\"capture\":true,\"viewing\":true,\"catch_up\":true,\"widget_looping_mode\":\"never\"}","camera_roll_preview_enabled":"true","camera_roll_video_enabled":"true","camera_roll_video_upload_enabled":"true","internal_camera_roll_video_upload_enabled":"true","longer_camera_roll_videos_enabled":"true","camera_roll_video_max_duration":"45","camera_roll_max_duration":"45","camera_roll_duration":"45","max_video_duration":"45","video_max_duration":"45","video_trim_max_duration":"45","trim_max_duration":"45","gold_max_duration":"45","goldMaxDuration":"45","max_file_size":"104857600","max_upload_bytes":"104857600","video_quality_mbps":"0.","video_sound_enabled":"true","microphone_enabled":"true","camera_microphone_enabled":"true","audio_session_deactivation_enabled":"true","zoom_enabled":"true","upload_main":"false","upload_main_image_quality":"0.6","upload_main_image_size":"1440","upload_thumbnail_image_quality":"0.6","upload_thumbnail_image_size":"1020","max_friends_count":"999999","friend_limit_mode":"0","soft_friend_limit_threshold_count":"999999","show_friend_limit_on_cam":"false","signup_max_friends_count":"999999","celebrity_inbox_limit":"999999","friend_limit_geo_override":"{\"experiments\":{},\"area_code_overrides\":{}}","friends_sheet_locket_count_config":"{\"items\":[{\"threshold\":0,\"icon_name\":\"heart\"},{\"threshold\":1,\"icon_name\":\"heart.fill\"},{\"threshold\":10,\"emoji\":\"🤍\"},{\"threshold\":100,\"emoji\":\"💛\"},{\"threshold\":500,\"emoji\":\"❤️‍🔥\"},{\"threshold\":1000,\"emoji\":\"🌟🫶🌟\"},{\"threshold\":2000,\"emoji\":\"✨💟✨\"},{\"threshold\":5000,\"emoji\":\"⚡️😵‍💫⚡\"},{\"threshold\":10000,\"emoji\":\"✨⚡️😱⚡✨\"}]}","friend_locket_count_config":"{\"items\":[{\"threshold\":0,\"icon_name\":\"heart\"},{\"threshold\":1,\"icon_name\":\"heart.fill\"},{\"threshold\":10,\"emoji\":\"🤍\"},{\"threshold\":100,\"emoji\":\"💛\"},{\"threshold\":500,\"emoji\":\"❤️‍🔥\"},{\"threshold\":1000,\"emoji\":\"✨💗✨\"},{\"threshold\":2000,\"emoji\":\"✨️⭐️✨\"},{\"threshold\":5000,\"emoji\":\"✨💎✨\"},{\"threshold\":10000,\"emoji\":\"✨🔐💛✨\"}]}","new_friends_monitoring_enabled":"true","improved_friend_suggestions":"true","show_friend_suggestions_by_default":"true","emoji_friend_suggestions":"true","hide_friends_enabled":"true","hide_invite_links":"false","show_invite_suggestions":"true","show_no_friends_bottom_sheet":"false","signup_allow_skip_add_friends":"true","streak_config":"{\"minimum_recovery_count\":0,\"minimum_display_count\":0}","moment_views_enabled":"true","moment_views_v2":"true","record_moment_views":"true","notify_moment_views":"true","get_moment_views_as_cloud_function":"true","moment_reactions_v2":"true","chat_reactions_enabled":"true","conversation_reactions":"true","typing_indicators_enabled":"true","unsend_message_enabled":"true","reply_prototype_enabled":"true","messages_integration":"true","conversations_enabled":"true","fetch_moments_in_conversation":"true","hide_chat_button":"false","groups_enabled":"true","send_to_self_only_mode":"always_enabled","time_travel_rewind_v2_enabled":"true","calendar_delete_moment_enabled":"true","calendar_rewind_enabled":"false","locket_yearbook_story_sharing_encouraged":"true","rollcall_enabled":"true","rollcall_comment_actions":"true","rollcall_profile_button":"true","rollcall_prompt_export_after_share":"true","rollcall_confirm_skip_tagging":"false","rollcall_tap_to_tag_enabled":"false","widget_frame_event_max_images":"10","android_widget_frame_event_enabled":"true","widget_badge_enabled":"true","widget_badge_v2":"true","widget_stale_state_enabled":"false","widget_last_sent_indicator":"false","widget_sync_token_reload_mode":"clearTokenNever","live_activity_onboarding":"true","live_activity_onboarding_variant":"friending","notification_preferences_live_activities":"true","notification_preferences":"true","notification_reply_body_visible":"true","prompt_notification_permissions_after_friending":"true","activity_bar_enabled":"true","journal_activity_bar_enabled":"true","journal_settings":"{\"debug_menu_enabled\":false,\"focus_animation\":true,\"compact_header\":true,\"friends_button\":true,\"reverse_scroll_direction\":false,\"streak_visualization\":true,\"streak_visualization_style\":\"gradient\",\"streak_header_minimum_count\":0,\"streak_visualization_minimum_count\":2,\"overlay_indicators\":{\"location\":true,\"music\":true,\"static_content\":true,\"weather\":true}}","qr_code_config":"{\"profile_enabled\":true,\"scanning_enabled\":true}","custom_profile_pics":"true","profile_menu_v2_enabled":"true","custom_widget_frames":"enabled","custom_widget_frames_enabled":"true","overlay_navigator_enabled":"true","overlays_v2_config":"{\"suggestions_enabled\":true}","captions_enabled":"true","music_caption_enabled":"true","music_caption_song_preview_enabled":"true","link_caption_link_enabled":"true"},
  "overlays": [
    {
      "section": "🎨 General",
      "items": [
        {
          "overlay_id": "caption:standard",
          "source": "local",
          "caption": {
            "type": "standard"
          }
        },
        {
          "overlay_id": "caption:review",
          "source": "local",
          "caption": {
            "type": "review"
          }
        },
        {
          "overlay_id": "caption:music",
          "source": "local",
          "caption": {
            "type": "music"
          }
        },
        {
          "overlay_id": "caption:location",
          "source": "local",
          "caption": {
            "type": "location"
          }
        },
        {
          "overlay_id": "caption:weather",
          "source": "local",
          "caption": {
            "type": "weather"
          }
        },
        {
          "overlay_id": "caption:time",
          "source": "local",
          "caption": {
            "type": "time"
          }
        },
        {
          "overlay_id": "caption:streak",
          "source": "local",
          "caption": {
            "type": "streak"
          }
        },
        {
          "overlay_id": "caption:star_sign",
          "source": "local",
          "caption": {
            "type": "star_sign"
          }
        },
        {
          "overlay_id": "caption:poll",
          "source": "local",
          "caption": {
            "type": "poll"
          }
        },
        {
          "overlay_id": "caption:color_palette",
          "source": "local",
          "caption": {
            "type": "color_palette"
          }
        },
        {
          "overlay_id": "caption:locket_count",
          "source": "local",
          "caption": {
            "type": "locket_count"
          }
        }
      ]
    },
    {
      "section": "🎨 Holiday Caption",
      "items": [
        {
          "overlay_id": "caption:halloween_2026",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#150804",
                "#C8540D"
              ]
            },
            "icon": {
              "data": "🎃",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Halloween",
            "localized_text": {
              "en": "Halloween",
              "vn": "Halloween"
            },
            "text_color": "#FFB182",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:autumn_2026",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFE0A0",
                "#F6A53A"
              ]
            },
            "icon": {
              "data": "🍂",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xin chào Mùa Thu",
            "localized_text": {
              "en": "Xin chào Mùa Thu",
              "vn": "Xin chào Mùa Thu"
            },
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:christmas_eve_2026",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2FA85F",
                "#176B3A"
              ]
            },
            "icon": {
              "data": "🕯️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Giáng sinh an lành",
            "localized_text": {
              "en": "Giáng sinh an lành",
              "vn": "Giáng sinh an lành"
            },
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:christmas_day_2026",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E53935",
                "#A81818"
              ]
            },
            "icon": {
              "data": "🎄",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Giáng sinh an lành",
            "localized_text": {
              "en": "Giáng sinh an lành",
              "vn": "Giáng sinh an lành"
            },
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:new_years_eve_2026",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFC64B",
                "#FFEDBF"
              ]
            },
            "icon": {
              "data": "🥂",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xin chào 2027!",
            "localized_text": {
              "en": "Xin chào 2027!",
              "vn": "Xin chào 2027!"
            },
            "text_color": "#643F00",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:new_years_day_2027",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#3B00EC",
                "#823FFF"
              ]
            },
            "icon": {
              "data": "💫",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xin chào 2027!",
            "localized_text": {
              "en": "Xin chào 2027!",
              "vn": "Xin chào 2027!"
            },
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:new_years_day_2027_alternate",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF0062",
                "#FF783F"
              ]
            },
            "max_lines": 1,
            "text": "2027",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Decorative by Locket",
      "items": [
        {
          "overlay_id": "caption:party_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#5EFFF5",
                "#FCFF57"
              ]
            },
            "icon": {
              "data": "🪩",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Party Time!",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:good_morning",
          "source": "remote",
          "daily_start_hour": 5,
          "daily_end_hour": 10,
          "caption": {
            "background": {
              "colors": [
                "#EF7402",
                "#EABF0F"
              ]
            },
            "icon": {
              "data": "☀️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Good morning",
            "text_color": "#FFFFFFE5",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:goodnight",
          "source": "remote",
          "daily_start_hour": 19.5,
          "daily_end_hour": 24,
          "caption": {
            "background": {
              "colors": [
                "#370C6F",
                "#575CD4"
              ]
            },
            "icon": {
              "data": "🌙",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Goodnight",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ootd",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFFFFF",
                "#DBDBDB"
              ]
            },
            "icon": {
              "data": "🕶",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "OOTD",
            "text_color": "#101010E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:miss_you",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#EC0C00",
                "#FF493F"
              ]
            },
            "icon": {
              "data": "🥰",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Miss you",
            "text_color": "#FFFFFFDB",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨🎨🎨🎨🎨🎨",
      "items": [
        {
          "overlay_id": "caption:nca",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#B8E7FF",
                "#A8F5D0",
                "#DCCBFF"
              ]
            },
            "max_lines": 1,
            "text": "nguyencongan",
            "text_color": "#183153",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:feeling_cute",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F8BBD0",
                "#E91E63"
              ]
            },
            "icon": {
              "data": "🌷",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Feeling Cute",
            "localized_text": {
              "en": "Feeling Cute",
              "vn": "Cảm thấy dthw"
            },
            "text_color": "#FFFFFFE5",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFD6A5",
                "#FFF1A8",
                "#FFC4D6"
              ]
            },
            "max_lines": 1,
            "text": "Cu 🐎",
            "text_color": "#633B24",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tuat",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2C1A0E",
                "#5D4037",
                "#D7A86E"
              ]
            },
            "icon": {
              "data": "🐕",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tuất",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:wedding_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFE4E1",
                "#E73C7E"
              ]
            },
            "icon": {
              "data": "💍",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Wedding Time!",
            "localized_text": {
              "en": "Wedding Time!",
              "vn": "Đám cưới nè!"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cam_thay_hanh_phuc",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#EC407A",
                "#F8BBD0"
              ]
            },
            "icon": {
              "data": "🇻🇳",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cảm thấy hạnh phúc",
            "localized_text": {
              "en": "Feeling Happy",
              "vn": "Cảm thấy hạnh phúc"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:coffee_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#4E342E",
                "#8D6E63"
              ]
            },
            "icon": {
              "data": "☕",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Coffee Time!",
            "localized_text": {
              "en": "Coffee Time!",
              "vn": "Giờ uống cà phê!"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:snake_vibes",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2E7D32",
                "#66BB6A"
              ]
            },
            "icon": {
              "data": "🐍",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Snake Vibes",
            "localized_text": {
              "en": "Snake Vibes",
              "vn": "Chất rắn"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:mixue_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFF9C4",
                "#F8BBD0"
              ]
            },
            "icon": {
              "data": "🍦",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mixue Time!",
            "localized_text": {
              "en": "Mixue Time!",
              "vn": "Giờ Mixue!"
            },
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:locket_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#ECEFF1",
                "#B3E5FC"
              ]
            },
            "icon": {
              "data": "📷",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Locket Time!",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cinema_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1A237E",
                "#455A64"
              ]
            },
            "icon": {
              "data": "🎬",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cinema Time!",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:dating_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E91E63",
                "#F44336"
              ]
            },
            "icon": {
              "data": "💕",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Dating Time!",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:graduation_day",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1A237E",
                "#283593"
              ]
            },
            "icon": {
              "data": "🎓",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Happy Graduation Day!",
            "localized_text": {
              "en": "Happy Graduation Day!",
              "vn": "Chúc mừng tốt nghiệp!"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:shopping_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#B3E5FC",
                "#FFFFFF"
              ]
            },
            "icon": {
              "data": "🛍️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Shopping Time!",
            "localized_text": {
              "en": "Shopping Time!",
              "vn": "Giờ mua sắm!"
            },
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:dinner_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFCCBC",
                "#FF8A80"
              ]
            },
            "icon": {
              "data": "🍽️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Dinner Time!",
            "localized_text": {
              "en": "Dinner Time!",
              "vn": "Giờ ăn tối!"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:chilling_time",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E1BEE7",
                "#F8BBD0"
              ]
            },
            "icon": {
              "data": "🌴",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Chilling Time!",
            "localized_text": {
              "en": "Chilling Time!",
              "vn": "Giờ thư giãn!"
            },
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Độc lạ",
      "items": [
        {
          "overlay_id": "caption:xin_vinh_biet_cu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#232526",
                "#414345"
              ]
            },
            "icon": {
              "data": "🕯️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xin vĩnh biệt cụ",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:chay_ngay_di",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#D31027",
                "#EA384D"
              ]
            },
            "icon": {
              "data": "🏃💨",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Chạy ngay đi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:luc_nao_co_tien_thi_moi_di_a",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#0F2027",
                "#203A43",
                "#2C5364"
              ]
            },
            "icon": {
              "data": "💸",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Lúc nào có tiền thì mới đi á",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cu_tu_tu_khoai_se_nhu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#56AB2F",
                "#A8E063"
              ]
            },
            "icon": {
              "data": "🥔",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cứ từ từ khoai sẽ nhừ",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:kiem_tra_nhan_pham",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#654EA3",
                "#EAAFC8"
              ]
            },
            "icon": {
              "data": "🎲",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Kiểm tra nhân phẩm",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:doc_so_tai_khoan",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1E90FF",
                "#00D4FF"
              ]
            },
            "icon": {
              "data": "💳",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "đọc số tài khoản",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ai_so_thi_di_ve",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#B71C1C",
                "#FF5722"
              ]
            },
            "icon": {
              "data": "🏃",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "ai sợ thì đi về",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:con_cai_nit",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#D7CCC8",
                "#8D6E63"
              ]
            },
            "icon": {
              "data": "🧶",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "còn cái nịt",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:canh_bao_co_hat",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#9C27B0",
                "#E91E63"
              ]
            },
            "icon": {
              "data": "🎤",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "cảnh báo có hát",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:than_chua_ma_don",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#607D8B",
                "#37474F"
              ]
            },
            "icon": {
              "data": "😔",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Thân chưa mà dỡn",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ai_muon",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E91E63",
                "#F44336"
              ]
            },
            "icon": {
              "data": "🤔",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ai mượn?",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:hay_ra_de_qua_a",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFF59D",
                "#80DEEA"
              ]
            },
            "icon": {
              "data": "🥺",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Hay ra dẻ quá à!",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:giam_suc_manh_con_tuong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#4CAF50",
                "#00BCD4"
              ]
            },
            "icon": {
              "data": "🎮",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Giảm sức mạnh con tướng",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:mac_co_qua_hai_oi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFB74D",
                "#F8BBD0"
              ]
            },
            "icon": {
              "data": "😭",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mắc cỡ quá hai ơi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:minh_la_lop",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#263238",
                "#455A64"
              ]
            },
            "icon": {
              "data": "🛞",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mình là lốp",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:dep_trai_co_gi_sai",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF5722",
                "#FFC107"
              ]
            },
            "icon": {
              "data": "😎",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Đẹp trai có gì sai",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:mong_ton_hoa_sen",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#D8B4E2",
                "#F8BBD0"
              ]
            },
            "icon": {
              "data": "🪷",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mong tôn hoa sen thấy cảnh này",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:dam_nhau_khong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E53935",
                "#FF7043"
              ]
            },
            "icon": {
              "data": "🥊",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "đấm nhau không",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:sieu_cap_ba_khi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#EC407A",
                "#F44336"
              ]
            },
            "icon": {
              "data": "🐉",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "siêu cấp bá khí",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:du_an_ma",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#263238",
                "#455A64"
              ]
            },
            "icon": {
              "data": "👻",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "dự án ma",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:doi_roi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF5F6D",
                "#FFC371"
              ]
            },
            "icon": {
              "data": "😤",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Dỗi rồi",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:dang_ban_tuong_tu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1A2980",
                "#26D0CE"
              ]
            },
            "icon": {
              "data": "💭",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Đang bận tương tư",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:mo_hon_nhung_tam_hien",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFB75E",
                "#ED8F03"
              ]
            },
            "icon": {
              "data": "🐤",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mỏ hỗn nhưng tâm hiền",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:muon_duoc_om",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF9A9E",
                "#FECFEF"
              ]
            },
            "icon": {
              "data": "🫂",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Muốn được ôm",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Trend TikTok",
      "items": [
        {
          "overlay_id": "caption:hoi_chieu_troi_mua",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#546E7A",
                "#263238"
              ]
            },
            "icon": {
              "data": "🌧️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Hồi chiều trời mưa...",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:con_vien_la_lan",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#12C2E9",
                "#F64F59"
              ]
            },
            "icon": {
              "data": "🍂",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "côn viên lá làn",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:gian_dang_iu_hong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#3E2723",
                "#6D4C41",
                "#A1887F"
              ]
            },
            "icon": {
              "data": "🪳",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Gián đáng iu hong",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:nau_xoi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#7B1FA2",
                "#E91E63",
                "#FFB74D"
              ]
            },
            "icon": {
              "data": "🙀",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Nấu xói",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:co_tien_lam_phien_thien_ha",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#0F0C29",
                "#302B63",
                "#F7971E",
                "#FFD200"
              ]
            },
            "icon": {
              "data": "💰",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Có tiền làm phiền thiên hạ",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:nguoi_im_lang_gap_nguoi_hay_noi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#232526",
                "#414345",
                "#6C7A89",
                "#B0BEC5"
              ]
            },
            "icon": {
              "data": "🤐",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Người im lặng gặp người hay nói",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:roi_let_luon",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF9A9E",
                "#FECFEF",
                "#FBC2EB",
                "#A6C1EE"
              ]
            },
            "icon": {
              "data": "💅",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "rồi lét luôn",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:roi_gay_luon",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF6EC7",
                "#7873F5",
                "#4ADEDE",
                "#FFE66D"
              ]
            },
            "icon": {
              "data": "🌈",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "rồi gay luôn",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tuyet_doi_khong_nghe",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF416C",
                "#FF4B2B"
              ]
            },
            "icon": {
              "data": "🙉",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tuyệt đối không nghe",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cha_nay_tu_luyen_ghe",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFDEE9",
                "#B5FFFC",
                "#FAD0C4",
                "#FFD1FF"
              ]
            },
            "icon": {
              "data": "🪞",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cha này tự luyến ghê",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:co_bien_co_bien",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF512F",
                "#F09819",
                "#FFD200"
              ]
            },
            "icon": {
              "data": "🚨",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Có biến có biến",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:hong_drama",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#8A2387",
                "#E94057",
                "#F27121"
              ]
            },
            "icon": {
              "data": "🍿",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Hóng drama",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cuoi_vcl_m_oi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F7971E",
                "#FFD200",
                "#FFEE58"
              ]
            },
            "icon": {
              "data": "😂",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cười vcl m oi",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:vl_m_oi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1F1C2C",
                "#928DAB",
                "#C9D6FF"
              ]
            },
            "icon": {
              "data": "😳",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "vl m ơi?",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:noi_het_bi_mat_thi_co_yeu_hong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#EE9CA7",
                "#FFDDE1",
                "#C6FFDD",
                "#FBD786"
              ]
            },
            "icon": {
              "data": "🤫",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Nói hết bị mật thì có yêu hong",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:flex_den_hoi_tho_cuoi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F7971E",
                "#FFD200"
              ]
            },
            "icon": {
              "data": "💎",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Flex đến hơi thở cuối",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:overthinking_vai_chuong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2C3E50",
                "#4CA1AF"
              ]
            },
            "icon": {
              "data": "🤯",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Overthinking vai chưởng",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:chan_bo_may_di",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#870000",
                "#190A05"
              ]
            },
            "icon": {
              "data": "🙄",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Chan bố mày đi",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:oach_xa_lach",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#11998E",
                "#38EF7D"
              ]
            },
            "icon": {
              "data": "🥬",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "oách xà lách",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:lai_phai_lo",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FBD3E9",
                "#BB377D",
                "#6A0572"
              ]
            },
            "icon": {
              "data": "💔",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "lại phải lọ",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ua_alo",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#8E2DE2",
                "#4A00E0"
              ]
            },
            "icon": {
              "data": "📞",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ủa alo",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ke_chuyen_nghe_choi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#8A2387",
                "#E94057"
              ]
            },
            "icon": {
              "data": "🍿",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Kể chuyện nghe chơi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:hom_nay_toi_buon",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#141E30",
                "#243B55"
              ]
            },
            "icon": {
              "data": "🥀",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "hôm nay tôi buồn",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:xinh_dep_tuyet_voi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FC5C7D",
                "#6A82FB"
              ]
            },
            "icon": {
              "data": "💅",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xinh đẹp tuyệt vời",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tram_cam_nhe",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1F1C2C",
                "#928DAB"
              ]
            },
            "icon": {
              "data": "🫠",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Trầm cảm nhẹ",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:chua_du_wow",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF5349",
                "#EB0C00"
              ]
            },
            "icon": {
              "data": "⭐",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Chưa đủ wow",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:boc_trung_sit_rit",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#9C27B0",
                "#7B1FA2"
              ]
            },
            "icon": {
              "data": "🎁",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Bóc trúng sít rịt",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:hen_lam_moi_xui_duoc_vay_a",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#00BCD4",
                "#0097A7"
              ]
            },
            "icon": {
              "data": "😅",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Hèn lắm mới xui được vậy á",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ra_duong_ne_moi_anh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2196F3",
                "#1976D2"
              ]
            },
            "icon": {
              "data": "👤",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ra đường nể mỗi anh",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cung_cung_di",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFC107",
                "#FFA000"
              ]
            },
            "icon": {
              "data": "🚀",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cũng cứng đi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tuyet_doi_dien_anh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#455A64",
                "#263238"
              ]
            },
            "icon": {
              "data": "📷",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tuyệt đối điện ảnh",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:du_ba_khi_chua",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF5722",
                "#E64A19"
              ]
            },
            "icon": {
              "data": "⚡",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Đủ bá khí chưa",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ua_alo",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#9C27B0",
                "#7B1FA2"
              ]
            },
            "icon": {
              "data": "❓",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ủa alo?",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cai_gi_vay_troi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F44336",
                "#D32F2F"
              ]
            },
            "icon": {
              "data": "❗",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cái gì vậy trời",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:nay_la_het_cuu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#607D8B",
                "#455A64"
              ]
            },
            "icon": {
              "data": "❌",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Này là hết cứu",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:qua_la_dien_anh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#26A69A",
                "#00897B"
              ]
            },
            "icon": {
              "data": "📷",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Quá là điện ảnh",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Gen Z Life 🩻",
      "items": [
        {
          "overlay_id": "caption:hao_han",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#114357",
                "#F29492"
              ]
            },
            "icon": {
              "data": "🗡️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Hảo hán",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:cam_lanh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2193B0",
                "#6DD5ED"
              ]
            },
            "icon": {
              "data": "🤧",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cảm lạnh",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:bat_luc",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2C3E50",
                "#3498DB"
              ]
            },
            "icon": {
              "data": "🏳️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Bất lực",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:xin_lui_duoc_chua",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F6D365",
                "#FDA085"
              ]
            },
            "icon": {
              "data": "🥺",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xin lũi được chưa",
            "text_color": "#000000",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:rot_nuoc_mat",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#1CB5E0",
                "#000046"
              ]
            },
            "icon": {
              "data": "😭",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Rớt nước mắt",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:guc_nga",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#3A1C71",
                "#D76D77"
              ]
            },
            "icon": {
              "data": "📉",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Gục ngã",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tien_dinh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#C33764",
                "#1D2671"
              ]
            },
            "icon": {
              "data": "🌪️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tiền đình",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:che_manh",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF4E50",
                "#F9D423"
              ]
            },
            "icon": {
              "data": "👎",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Chê mạnh",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:xinh_gai_an_phim_1",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F77062",
                "#FE5196"
              ]
            },
            "icon": {
              "data": "💅",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Xinh gái ấn phím 1",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:di_lam_vi_dam_me",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FDC830",
                "#F37335"
              ]
            },
            "icon": {
              "data": "🤡",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Đi làm vì đam mê",
            "text_color": "#FFFFFF",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Meme vui nhộn",
      "items": [
        {
          "overlay_id": "caption:cuoi_xiu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFEB3B",
                "#FF9800"
              ]
            },
            "icon": {
              "data": "😎",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cười xỉu",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:toang_that_roi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F44336",
                "#B71C1C"
              ]
            },
            "icon": {
              "data": "🐉",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Toang thật rồi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:toi_roi_toi_roi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#673AB7",
                "#512DA8"
              ]
            },
            "icon": {
              "data": "❗",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tới rồi tới rồi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:khong_the_tin_noi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#00BCD4",
                "#0097A7"
              ]
            },
            "icon": {
              "data": "❓",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Không thể tin nổi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Đời sống",
      "items": [
        {
          "overlay_id": "caption:ngay_moi_vui_ve",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#4CAF50",
                "#2E7D32"
              ]
            },
            "icon": {
              "data": "☀️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ngày mới vui vẻ",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ngu_ngon",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#3F51B5",
                "#1A237E"
              ]
            },
            "icon": {
              "data": "🌙",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ngủ ngon",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:an_com_chua",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF9800",
                "#F57C00"
              ]
            },
            "icon": {
              "data": "🍽️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ăn cơm chưa?",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:di_choi_khong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#E91E63",
                "#C2185B"
              ]
            },
            "icon": {
              "data": "✈️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Đi chơi không?",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Gen Z Slay",
      "items": [
        {
          "overlay_id": "caption:tinh_hoa_hoi_tu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFD700",
                "#FF8C00"
              ]
            },
            "icon": {
              "data": "✨",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tinh hoa hội tụ",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:phu_tinh_khong_phu_ban",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#8E2DE2",
                "#4A00E0"
              ]
            },
            "icon": {
              "data": "🕶️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Phụ tình không phụ bản",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ngoan_xinh_yeu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FFAFBD",
                "#FFC3A0"
              ]
            },
            "icon": {
              "data": "🌸",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Ngoan xinh yêu của ai?",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:nhin_la_biet_uy_tin",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#2980B9",
                "#2C3E50"
              ]
            },
            "icon": {
              "data": "👌",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Nhìn là biết uy tín",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Bất ổn & Khó đỡ",
      "items": [
        {
          "overlay_id": "caption:luon_vui_tuoi",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#00F2FE",
                "#4FACFE"
              ]
            },
            "icon": {
              "data": "🤡",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Luôn vui tươi",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:bat_on_that_su",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#636363",
                "#A2AB58"
              ]
            },
            "icon": {
              "data": "🫠",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Bất ổn thật sự",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:khong_cam_xuc",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#434343",
                "#000000"
              ]
            },
            "icon": {
              "data": "🗿",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Không cảm xúc",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:phu_huynh_dung_xem",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#FF0844",
                "#FFB199"
              ]
            },
            "icon": {
              "data": "🙈",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Phụ huynh đừng xem",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Check VAR & Hóng hớt",
      "items": [
        {
          "overlay_id": "caption:check_var",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#11998E",
                "#38EF7D"
              ]
            },
            "icon": {
              "data": "📺",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Check VAR liền",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:qua_nhieu_su_de_thuong",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#F38181",
                "#FCE38A"
              ]
            },
            "icon": {
              "data": "🎀",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Quá nhiều sự dễ thương",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:mac_bay_tinh_yeu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#EE9CA7",
                "#FFDDE1"
              ]
            },
            "icon": {
              "data": "💘",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Mắc bẫy tình yêu",
            "text_color": "#000000E6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:song_gio_phu_doi_trai",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#3A1C71",
                "#D76D77"
              ]
            },
            "icon": {
              "data": "🌪️",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Sóng gió phủ đời trai",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    },
    {
      "section": "🎨 Góc Deadline & Đi Làm",
      "items": [
        {
          "overlay_id": "caption:deadline_ruot",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#ED213A",
                "#93291E"
              ]
            },
            "icon": {
              "data": "🔥",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Deadline dí tụt quần",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:ca_o_ran_doc",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#0F2027",
                "#1B5E20",
                "#66BB6A"
              ]
            },
            "icon": {
              "data": "🐍",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cả ổ rắn độc",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:tien_dau_ma_tieu",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#11998E",
                "#38EF7D"
              ]
            },
            "icon": {
              "data": "💸",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Tiền đâu mà tiêu",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        },
        {
          "overlay_id": "caption:nghien_cuu_khoa_hoc",
          "source": "remote",
          "caption": {
            "background": {
              "colors": [
                "#0F2027",
                "#2C5364"
              ]
            },
            "icon": {
              "data": "☕",
              "type": "emoji"
            },
            "max_lines": 1,
            "text": "Cần nạp cafein gấp",
            "text_color": "#FFFFFFE6",
            "type": "static_content"
          }
        }
      ]
    }
  ],
  "filters": {"allows_custom_filters":true,"show_filter_button":true,"sheet_enabled":true,"open_sheet_immediately":true,"sheet_filters":[{"title":{"en":"Goofy"},"filter_ids":["okay_wig","influencer","looks_maxxing","toothless","bye_brows"]},{"title":{"en":"Looks"},"filter_ids":["bowling_ball","blonde_bleached","beard","bob_cut","buns","tatted","mohawk","braces","bye_brows"]},{"title":{"en":"Celebrate"},"filter_ids":["slimed","princess","disco_lights","cash_money","happy_birthday"]},{"title":{"en":"Cute"},"filter_ids":["cutesy","sticker_face","flower_crown","love_bug"]},{"title":{"en":"Costumes"},"filter_ids":["wedding","cowboy_cowgirl","giraffe","clown"]},{"title":{"en":"Holidays"},"filter_ids":["easter_bunney_cutout","easter_chick_cutout","bearded","leprechaun","lucky_face","sweet_hearts","elf_cutout","santa_cutout","frosty"]}],"picker_filters":["okay_wig","influencer","looks_maxxing","toothless","bye_brows","bowling_ball","blonde_bleached","beard","bob_cut","buns","tatted","mohawk","braces","slimed","princess","disco_lights","cash_money","happy_birthday","cutesy","sticker_face","flower_crown","love_bug","wedding","cowboy_cowgirl","giraffe","clown","easter_bunney_cutout","easter_chick_cutout","bearded","leprechaun","lucky_face","sweet_hearts","elf_cutout","santa_cutout","frosty"]},
  "featureGates": {"app_icon_picker":"enabled","camera_roll":"enabled","camera_theme":"enabled","locket_views":"enabled","long_captions":"enabled","longer_video":"enabled","unlimited_friends":"enabled","priority_support":"enabled","profile_badge":"enabled","remove_ads":"enabled","video":"enabled","custom_widget_frames":"enabled","streak_recovery":"enabled"}
};

(function () {
  'use strict';
  var finished = false;
  function finish(value) { if (!finished) { finished = true; $done(value || {}); } }
  function record(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function header(headers, name) {
    var keys = Object.keys(headers || {});
    for (var i=0;i<keys.length;i++) if (keys[i].toLowerCase()===name.toLowerCase()) return String(headers[keys[i]]);
    return '';
  }
  function debug(message) {
    if (SETTINGS.debug && typeof console !== 'undefined') console.log('[Locket Custom] '+message);
  }
  function bounded(value,min,max,fallback) {
    var number=Number(value); return isFinite(number) ? Math.min(max,Math.max(min,number)) : fallback;
  }
  function responseOK(res) {
    var raw=res.statusCode !== undefined ? res.statusCode : res.status;
    if(raw === undefined) return true;
    var match=String(raw).match(/\b([1-5][0-9]{2})\b/);
    return !!match && Number(match[1])>=200 && Number(match[1])<300;
  }
  function objectValue(value) {
    if (record(value)) return value;
    if (typeof value==='string') { try { var parsed=JSON.parse(value); return record(parsed)?parsed:null; } catch (_) {} }
    return null;
  }
  function mergeObjects(old, patch) {
    var out=Object.assign({},old);
    Object.keys(patch).forEach(function(key) {
      if (key==='__proto__'||key==='constructor'||key==='prototype') return;
      out[key]=record(out[key])&&record(patch[key]) ? mergeObjects(out[key],patch[key]) : patch[key];
    });
    return out;
  }
  function mergeJSONString(entries,key,patch) {
    var old=entries[key]===undefined ? {} : objectValue(entries[key]);
    if(!old) { debug('Skipped an invalid nested configuration.'); return; }
    entries[key]=JSON.stringify(mergeObjects(old,patch));
  }
  function mergeCameraFilters(entries) {
    var key='camera_filter_config';
    var old=entries[key]===undefined ? {} : objectValue(entries[key]);
    if(!old) return;
    var patch=Object.assign({},PRESETS.filters);
    // Keep the live catalogue/order. Old filter IDs are fallback data only.
    ['sheet_filters','picker_filters'].forEach(function(name) {
      if(old[name]!==undefined && !(Array.isArray(old[name]) && old[name].length===0)) {
        delete patch[name];
      }
    });
    entries[key]=JSON.stringify(mergeObjects(old,patch));
  }
  function captionSection() {
    var items=[];
    (Array.isArray(SETTINGS.customCaptions)?SETTINGS.customCaptions:[]).forEach(function(c) {
      if(!record(c)||typeof c.id!=='string'||!/^nien_[a-z0-9_]+$/.test(c.id)||typeof c.text!=='string') return;
      var colors=(Array.isArray(c.colors)?c.colors:[]).filter(function(x){return /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(x);});
      items.push({overlay_id:'caption:'+c.id,source:'remote',caption:{
        background:{colors:colors.length?colors:['#EFE5D7','#D5B99D']},
        icon:{type:'emoji',data:typeof c.emoji==='string'?c.emoji:'✨'},
        max_lines:1,text:c.text.slice(0,160),
        text_color:/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(c.color)?c.color:'#33281F',type:'static_content'
      }});
    });
    return {section:'✨ Niên • Custom',items:items};
  }
  function mergeCaptions(entries) {
    var sections=[];
    if(entries.overlay_items!==undefined) {
      try { sections=JSON.parse(entries.overlay_items); } catch (_) { debug('Kept malformed overlay data unchanged.'); return; }
      if(!Array.isArray(sections)) return;
    }
    var merged=[],seen=Object.create(null),custom=captionSection(),customIds=Object.create(null);
    custom.items.forEach(function(item){customIds[item.overlay_id]=true;});
    sections=sections.map(function(section){
      if(!record(section)||!Array.isArray(section.items))return section;
      return Object.assign({},section,{items:section.items.filter(function(item){return !record(item)||!customIds[item.overlay_id];})});
    });
    var extra=SETTINGS.includeOriginalCaptions?PRESETS.overlays:[];
    sections.concat(extra,[custom]).forEach(function(section) {
      if(!record(section)||!Array.isArray(section.items)) { merged.push(section); return; }
      var items=section.items.filter(function(item) {
        if(!record(item)||typeof item.overlay_id!=='string') return true;
        if(seen[item.overlay_id]) return false;
        seen[item.overlay_id]=true; return true;
      });
      if(items.length) merged.push(Object.assign({},section,{items:items}));
    });
    entries.overlay_items=JSON.stringify(merged);
    // Do not replace server-side dynamic types with invented frame/photobooth types.
  }
  function updateRemoteConfig(body) {
    if(!record(body.entries)) return false;
    var e=body.entries;
    Object.keys(PRESETS.entries).forEach(function(key) {
      var value=PRESETS.entries[key];
      if(/^history_ad/.test(key)) { if(SETTINGS.hideAds) e[key]=value; return; }
      if(/^sentry_/.test(key)) { if(SETTINGS.disableSentry) e[key]=value; return; }
      if(/friend|contact|celebrity|moment|reaction|chat|conversation|message|typing|streak|rollcall|calendar|rewind|send_to_self/.test(key)) {
        if(!SETTINGS.enableSocialOptions) return;
      } else if(/camera|video|microphone|upload|zoom|audio|gold_max|goldMax|trim_max|max_file|max_upload|live_photos/.test(key)) {
        if(!SETTINGS.enableCameraOptions) return;
      } else if(!SETTINGS.enableInterfaceOptions) return;
      var nested=objectValue(value);
      if(nested) mergeJSONString(e,key,nested); else e[key]=value;
    });
    if(SETTINGS.enableFeatureFlags) {
      var gates=Object.assign({},PRESETS.featureGates);
      if(!SETTINGS.hideAds)delete gates.remove_ads;
      mergeJSONString(e,'feature_gates',gates);
    }
    if(SETTINGS.enableCameraOptions) {
      var seconds=bounded(SETTINGS.videoSeconds,1,120,45);
      var bytes=Math.round(bounded(SETTINGS.maxUploadMiB,1,100,100)*1048576);
      var mbps=bounded(SETTINGS.videoMbps,0.1,20,0.6);
      mergeJSONString(e,'camera',{gold_max_duration:seconds,goldMaxDuration:seconds,max_duration:seconds,maxDuration:seconds,quality_mbps:mbps,qualityMbps:mbps});
      mergeJSONString(e,'camera_roll',{gold_max_duration:seconds,goldMaxDuration:seconds,video_max_duration:seconds,videoMaxDuration:seconds,max_duration:seconds,maxDuration:seconds,trim_max_duration:seconds,trimMaxDuration:seconds,camera_roll_max_duration:seconds,camera_roll_video_max_duration:seconds,max_file_size:bytes,max_upload_bytes:bytes,max_size_bytes:bytes,quality_mbps:mbps,qualityMbps:mbps});
      ['camera_roll_video_max_duration','camera_roll_max_duration','camera_roll_duration','max_video_duration','video_max_duration','video_trim_max_duration','trim_max_duration','gold_max_duration','goldMaxDuration'].forEach(function(k){e[k]=String(seconds);});
      e.max_file_size=String(bytes); e.max_upload_bytes=String(bytes); e.video_quality_mbps=String(mbps);
      if(SETTINGS.includeOriginalFilters) mergeCameraFilters(e);
    }
    if(SETTINGS.enableSocialOptions) {
      var friends=String(Math.floor(bounded(SETTINGS.maxFriends,1,999999,999999)));
      ['max_friends_count','soft_friend_limit_threshold_count','signup_max_friends_count','celebrity_inbox_limit'].forEach(function(k){e[k]=friends;});
      mergeJSONString(e,'streak_config',{minimum_recovery_count:0,minimum_display_count:0});
    }
    mergeCaptions(e);
    if(typeof SETTINGS.widgetFrameImageURL==='string' && /^https:\/\/[^\s@]+\.[^\s]+$/i.test(SETTINGS.widgetFrameImageURL)) {
      mergeJSONString(e,'widget_frame_event',{uid:'nien_custom_v1',url:SETTINGS.widgetFrameImageURL,
        placement:SETTINGS.widgetFramePlacement==='above'?'above':'below',
        start_at:'2020-01-01T00:00:00',end_at:'2099-12-31T23:59:59',use_local_time_zone:true});
    }
    return true;
  }
  function updateSubscription(body) {
    if(!SETTINGS.goldResponseOverride||!record(body.subscriber)) return false;
    var s=body.subscriber;
    if(s.entitlements!==undefined&&!record(s.entitlements)) return false;
    if(s.subscriptions!==undefined&&!record(s.subscriptions)) return false;
    var entitlements=s.entitlements||{},subscriptions=s.subscriptions||{};
    var existing=entitlements.Gold;
    // An existing lifetime/active real entitlement is preserved, including metadata.
    if(record(existing)&&(existing.expires_date===null||Date.parse(existing.expires_date)>Date.now())) return false;
    var purchase=Date.parse(SETTINGS.purchaseDate),expiry=Date.parse(SETTINGS.expiresDate);
    if(!isFinite(purchase)||!isFinite(expiry)||purchase>Date.now()||expiry<=Date.now()||expiry<=purchase) return false;
    var product='locket_1600_1y';
    // Do not overwrite any existing purchase record, even when its status is unclear.
    if(subscriptions[product]!==undefined) return false;
    subscriptions[product]={purchase_date:SETTINGS.purchaseDate,original_purchase_date:SETTINGS.purchaseDate,
      expires_date:SETTINGS.expiresDate,store:'app_store',is_sandbox:true,ownership_type:'PURCHASED',
      period_type:'normal',billing_issues_detected_at:null,unsubscribe_detected_at:null};
    entitlements.Gold={purchase_date:SETTINGS.purchaseDate,expires_date:SETTINGS.expiresDate,product_identifier:product};
    s.entitlements=entitlements;s.subscriptions=subscriptions;return true;
  }
  try {
    if(!SETTINGS.enabled||typeof $request==='undefined') return finish();
    var req=$request,url=String(req.url||''),ua=header(req.headers,'user-agent');
    // Fail closed: an unknown SDK User-Agent is left untouched, even if it is Locket.
    if(!/^(?:Locket|com\.locket\.Locket)(?:[\s\/]|$)/i.test(ua)) return finish();
    var remote=/^https:\/\/firebaseremoteconfig\.googleapis\.com\/v1\/projects\/locket-[A-Za-z0-9_-]+\/namespaces\/[^/?#]+:fetch(?:\?[^#]*)?$/.test(url);
    var revenue=/^https:\/\/api\.revenuecat\.com\/v1\/(?:receipts|subscribers\/[^/?#]+)\/?(?:\?[^#]*)?$/.test(url);
    if(!remote&&!revenue) return finish();
    if(typeof $response==='undefined') {
      if(!revenue||!SETTINGS.goldResponseOverride) return finish();
      var headers=Object.assign({},req.headers||{}),changed=false;
      Object.keys(headers).forEach(function(k){if(k.toLowerCase()==='x-revenuecat-etag'){delete headers[k];changed=true;}});
      return finish(changed?{headers:headers}:{});
    }
    if(!responseOK($response)||typeof $response.body!=='string'||$response.body.length>1048576) return finish();
    var body=JSON.parse($response.body);
    if(!record(body)||body.error||body.errors) return finish();
    var changed=remote?updateRemoteConfig(body):updateSubscription(body);
    if(changed) { debug(remote?'Updated Locket configuration.':'Updated local entitlement response.'); return finish({body:JSON.stringify(body)}); }
    finish();
  } catch (_) { debug('Skipped an incompatible response; original response preserved.'); finish(); }
})();
