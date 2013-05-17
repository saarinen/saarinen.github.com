/**
 * @package Fast_Blog_Template
 * @since Fast Blog 1.0
 */

// -----------------------------------------------------------------------------

(function($) {
	
	// -------------------------------------------------------------------------
	
	// Get data
	$.fn.getData = function(key, defaultValue) {
		return this.is('[data-'+key+']') ? this.data(key) : defaultValue;
	};
	
})(jQuery);

// -----------------------------------------------------------------------------

jQuery(document).ready(function($) {

	// Flickr API key
	flickr_api_key = '6baa65d21a4e4139d5e2f1b4943dcb2e';
	
	// Default configuration
	conf = $.extend({}, {
		fancybox: true, 
		cufon:    '',
		lang:     {
			search:          'search',
			bricksAllButton: 'all',
			timeDaysAgo:     'about %d days ago',
			timeDayAgo:      'about a day ago',
			timeHoursAgo:    'about %d hours ago',
			timeHourAgo:     'about an hour ago',
			timeMinutesAgo:  'about %d minutes ago',
			timeSecondsAgo:  'about %d seconds ago',
			timeNow:         'just now'
		}
	}, typeof fastblogeConfig != 'undefined' ? fastblogeConfig : {});
		
	// Browsers support
	ie = $.browser.msie ? parseInt($.browser.version) : 256;

	// Browser notification
	if (ie <= 6) {
		$('.browser-notification .close').click(function() { $(this).parent().hide(); });
		$('.browser-notification.ie6').show();
	}
	
	// Human time difference
	var humanTimeDiff = function(from, to)
	{
		if (typeof to == 'undefined') {
			to = new Date();
		}
		var delta = Math.abs((to.getTime() - from.getTime()) / 1000);
		if (delta < 1) {
			delta = 0;
		}
		var time_ago = {
			days:    parseInt(delta / 86400, 10),
			hours:   parseInt(delta / 3600, 10),
			minutes: parseInt(delta / 60, 10),
			seconds: parseInt(delta, 10)
		};
		if (time_ago.days > 2)     return conf.lang.timeDaysAgo.replace('%d', time_ago.days);
		if (time_ago.hours > 24)   return conf.lang.timeDayAgo;
		if (time_ago.hours > 2)    return conf.lang.timeHoursAgo.replace('%d', time_ago.hours);
		if (time_ago.minutes > 45) return conf.lang.timeHourAgo;
		if (time_ago.minutes > 2)  return conf.lang.timeMinutesAgo.replace('%d', time_ago.minutes);
		if (time_ago.seconds > 1)  return conf.lang.timeSecondsAgo.replace('%d', time_ago.seconds);
		return conf.lang.timeNow;
	};
	
	// Form
	$('p:not(.input):has(> input[type="text"])').addClass('input');
	$('p:not(.textarea):has(> textarea)').addClass('textarea');
	$('p:not(.submit):has(> input[type="submit"])').replaceWith(function() {
		var title = $('input', this).val();
		return '<p class="submit"><a title="'+title+'">'+title+'</a></p>';
	});
	$('form .submit a').click(function() {
		$(this).parentsUntil('form').last().parent().submit();
	});
	
	// Menu
	$('#menu li:has(> ul) > a').append(' &rsaquo;');
 
	// Cufon font replacement
	$('body').addClass('cufon');
	cufon_replace = [{
		selector: '#logo span',
		options: {fontFamily: 'League Gothic', color: scheme.colors.gradient.secondary}
	}, {
		selector: '#menu li:not(.current) > a, .post .title, .post .content h1, .post .content h2, .post .content h3, .post .content h4, .message',
		options: {color: scheme.colors.gradient.primary, hover: {color: scheme.colors.gradient.secondary}}
	}, {
		selector: '#menu li.current > a',
		options: {color: scheme.colors.gradient.secondary}
	}, {
		selector: 'form .submit a',
		options: {color: scheme.colors.submit, hover: {color: scheme.colors.gradient.secondary}}
	}];
	for (var i in cufon_replace) {
		Cufon.replace(cufon_replace[i].selector, cufon_replace[i].options);
	}
	if (conf.cufon) {
		Cufon.replace(conf.cufon);
	}

	// Menu
	if (ie <= 7) {
		$('#menu li ul').each(function() {
			var max_width = 0;
			$('> li', this).each(function() {
				var cufon_width = 0;
				$('> a > cufon', this).each(function() {
					cufon_width += parseInt($(this).css('width'));
				});
				if (cufon_width == 0) cufon_width = 150;
				max_width = Math.max(max_width, cufon_width);
			});
			$('> li', this).css('width', (max_width+20)+'px');
		});
	}
	
	// Search
	$('#search input[name="s"]').focus(function(){
		if ($(this).val() == conf.lang.search) $(this).val('');
	}).blur(function() {
		if ($(this).val() == '') $(this).val(conf.lang.search);
	});
	
	// Post
	var posts = $('.post');
	if (ie >= 9) $('.post-icon > *', posts).fadeTo(0, 0).css('display', 'block');
	posts.hover(function() {
		var icon = $('.corner, .post-icon > *', this);
		if (ie >= 9) icon.stop(true).fadeTo('fast', 1); else icon.css('display', 'block');
	}, function() {
		var icon = $('.corner, .post-icon > *', this);
		if (ie >= 9) icon.stop(true).fadeTo('fast', 0); else icon.hide();
	});
	
	// Comments
	$('.comment').hover(function() {
		$('.tools', this).css('visibility', 'visible');
	}, function() {
		$('.tools', this).css('visibility', 'hidden');
	});

	// Widgets
	$('.widget_twitter, .widget_flickr').each(function() {
		if (ie >= 9) $('.title a', this).fadeTo(0, 0).css('display', 'block'); 
		$('.title', this).hover(function() {
			var a = $('a', this);
			if (ie >= 9) a.stop(true).fadeTo('fast', 1); else a.css('display', 'block');
		}, function() {
			var a = $('a', this);
			if (ie >= 9) a.stop(true).fadeTo('fast', 0); else a.hide();
		});
	});
	
	// Twitter
	$('.widget_twitter[data-username]').each(function() {
		var _this       = this;
		$.getJSON('php/twitter.php', {
			username:         $(this).data('username'),
			include_retweets: $(this).getData('include-retweets', true),
			exclude_replies:  $(this).getData('exclude-replies', false),
			count:            $(this).getData('count', 3),
		}, function(data) {
			var tweets = $('.tweets', _this);
			$.each(data, function() {
				$('<li />')
					.html(this.html+'<br /><small><a href="'+this.url+'">'+humanTimeDiff(new Date(this.date*1000))+'</a></small>')
					.appendTo(tweets);
			});
		});
	});
	
	// Flickr
	$('.widget_flickr[data-id][data-count]').each(function() {
		var _this = this;
		$.getJSON(
			'http://api.flickr.com/services/rest/?api_key='+flickr_api_key+'&method=flickr.people.getPublicPhotos&format=json&user_id='+$(this).data('id')+'&per_page='+$(this).data('count')+'&jsoncallback=?',
			function(data) {
				if (data.stat != 'ok') return;
				$.each(data.photos.photo, function(i, photo) {
					var img_class = i < 2 ? 'class="top" ' : '';
					$('> .photos', _this).append('<a href="http://www.flickr.com/photos/'+photo.owner+'/'+photo.id+'" title="'+photo.title+'"><img src="http://farm'+photo.farm+'.staticflickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_s.jpg" alt="" width="75" height="75" '+img_class+'/></a>');
				});
			}
		);
	});

	// Contact form
	$('.contact-form').submit(function() {
		if ($('.submit', this).hasClass('disabled')) return false;
		$('.submit', this).addClass('disabled').fadeTo('normal', 0.4);
		$('.status', this).text('');
		$('.loader', this).fadeIn('normal');
		$.post($(this).attr('action'), $(this).serialize(), function(data) {
			contact_form = $('.contact-form');
			if (data.result) $('input[type!=hidden], textarea', contact_form).val('');
			$('.submit', contact_form).removeClass('disabled').fadeTo('normal', 1);
			$('.status', contact_form).text(data.message);
			$('.loader', contact_form).fadeOut('normal');
		}, 'json');
		return false;
	});
	
	// Fancybox
	if (conf.fancybox) {
		$('.post .content a').filter(function () {
			return /\.(jpe?g|png|gif|bmp)/i.test($(this).attr('href'));
		}).attr('rel', function() {
			return 'fb-'+$(this).parentsUntil('.post').last().parent().attr('id');
		}).fancybox({
			titleShow: false,
			showNavArrows: true
		});
	}
	
});