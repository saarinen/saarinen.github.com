---
layout: post
title: "Mounting a Rails 4 App in a Subdirectory using NGINX"
date: 2013-05-16 13:58
comments: true
categories: ['Rails', 'nginx', 'unicorn']
---

Here at <a href="www.whitepages.com">WhitePages</a>, I've been working on a Rails 4.0.rc1 application to serve third party integration functionality.  I needed this service to be available to all domains and sub-domains serviced by <a href="www.whitepages.com">WhitePages</a> ( of which there are several ), and I needed the application to be available on a same-origin basis for integration reasons.  These constraints necessitated deploying my new application mounted to a unique subdirectory that could be detected by the load balancer on any domain, and routed to our NGINX instance.  The question then becomes: "How can I mount my Rails app on a subdirectory?"  Let's take this step by step:

<h5>1: Letting Rails know it is mounted on a subdirectory</h5>

The first task to mark off the list is to tell Rails that the routes that it needs to generate and answer to will include a subdirectory.  Rails, thankfully, provides just such a configuration variable.  In keeping with Rails 4 conventions, I placed this config change in an intializer in config/initializers:

``` ruby config/initializers/mount_location.rb
# Mount this application to a unique subdirectory
# You can either use Rails.application.config or <AppName>::Application.config
<AppName>::Application.config.relative_url_root = '/my_directory'
```

<h5>2: Getting Rails to respond on a subdirectory</h5>

Now that rails knows that it is mounted on a subdirectory, we need to configure rack to pass requests on that subdirectory to our Rails application.  We do that by modifying the config.ru file in our application root:

``` ruby config.ru
# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment',  __FILE__)

map <AppName>::Application.config.relative_url_root || "/" do
  run Rails.application
end
```

Here we check to see if our application has been configured with a relative_url_root.  If so, we mount our rails app at that location.

Starting up our Rails server, our application should now be responding on the subdirectory we mounted it on.  Success!! Well...not quite.  All of our static assets are currently responding correctly because they are being served from our Rails 4 application in development mode.  When running in production mode, all my static assets are failing to load?  What is going on? It looks like NGINX is not resolving paths to my static assets correctly.  Time to make some NGINX configuration changes to make sure it looks for static assets in the right location when we are running in production mode...

<h5>3: Telling NGINX where my static assets are</h5>

OK, heres the problem, the following entry comes from the nginx site config file:

``` nginx nginx.conf
root <path_to_my_app>/public;

location @proxy_to_app {
  proxy_pass http://<%= @service_name %>_workers;
}

location / {
  try_files $uri $uri/ @proxy_to_app;
}
```

When a request comes to our application on our subdirectory path, for example http://test.com/our_path/assets/images/test.png, NGINX will look in our public directory for a file mathing the path '/our_path/assets/images/test.png'.  The file doesn't exist there, it exists at '/assets/images/test.png'. How can we tell NGINX to drop our subdirectory from the path it is trying to locate our static assets from?  The answer lies in the <a href='http://wiki.nginx.org/HttpCoreModule#alias'>alias</a> directive.  Using the alias directive, we can use a location matcher that matches our subdirectory and NGINX will drop the matched element of our location from the static asset search path.  Let's look at the modified code:

``` nginx nginx.conf
root <path_to_my_app>/public;

location @proxy_to_app {
  proxy_pass http://<%= @service_name %>_workers;
}

location /our_path/ {
  alias <path_to_my_app>/public/;

  try_files $uri $uri/ @proxy_to_app;
}
```

Success at last! Now NGINX is correctly searching our public directory for our apps static files, and our Rails 4 application is correctly responding to the routes containing the subdirectory and generating paths with our configured subdirectory.

