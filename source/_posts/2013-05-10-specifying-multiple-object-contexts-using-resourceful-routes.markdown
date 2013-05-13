---
layout: post
title: "Resourceful Routes in the Real World"
date: 2013-05-10 00:11
comments: true
categories: ['Rails', 'Ruby', 'Routing']
---

When designing a resourceful object hierarchy in Rails, often a single model has meaning in multiple different contexts.  Take for example an application managing rental properties. This application has two main models, Properties and Tenants.  These models have obvious relationships with each other. Relating a set of tenants to a specific property, for example.  These models also have value independent of this relationship. At <a href='http://www.whitepages.com'>WhitePages.com</a> we are often modeling entities that exist in many different contexts, somewhat like a graph. The question then becomes, how can I model a relationship such as a has_many/belongs_to using resourceful routes while still allowing direct root access to a model, or potentially access through several different model connections?. Can I access the same controller resource through different routes? The answer is yes.  Lets take a look at a basic example to see how we can make this happen.

Let's start with the following models:

``` ruby Property and Tenant Models
class Property < ActiveRecord::Base
  has_many :tenants
  accepts_nested_attributes_for :tenants
end

class Tenant < ActiveRecord::Base
  belongs_to :property
end
```

The default scaffolding generator gives us the following routes with both resources at root:

{% codeblock %}
       Prefix Verb   URI Pattern                    Controller#Action
      tenants GET    /tenants(.:format)             tenants#index
              POST   /tenants(.:format)             tenants#create
   new_tenant GET    /tenants/new(.:format)         tenants#new
  edit_tenant GET    /tenants/:id/edit(.:format)    tenants#edit
       tenant GET    /tenants/:id(.:format)         tenants#show
              PATCH  /tenants/:id(.:format)         tenants#update
              PUT    /tenants/:id(.:format)         tenants#update
              DELETE /tenants/:id(.:format)         tenants#destroy
   properties GET    /properties(.:format)          properties#index
              POST   /properties(.:format)          properties#create
 new_property GET    /properties/new(.:format)      properties#new
edit_property GET    /properties/:id/edit(.:format) properties#edit
     property GET    /properties/:id(.:format)      properties#show
              PATCH  /properties/:id(.:format)      properties#update
              PUT    /properties/:id(.:format)      properties#update
              DELETE /properties/:id(.:format)      properties#destroy
{% endcodeblock %}

These routes are workable, but do not correctly illustrate our designed model.  Modeling the routes to match our belongs_to/has_many relationship, we would generate the following nested routes in config/routes.rb:

``` ruby routes.rb
TestApp::Application.routes.draw do
  resources :properties do
    resources :tenants
  end
end
```

Nesting our resources like this, we now have the following routes:

{% codeblock %}
              Prefix Verb   URI Pattern                                         Controller#Action
    property_tenants GET    /properties/:property_id/tenants(.:format)          tenants#index
                     POST   /properties/:property_id/tenants(.:format)          tenants#create
 new_property_tenant GET    /properties/:property_id/tenants/new(.:format)      tenants#new
edit_property_tenant GET    /properties/:property_id/tenants/:id/edit(.:format) tenants#edit
     property_tenant GET    /properties/:property_id/tenants/:id(.:format)      tenants#show
                     PATCH  /properties/:property_id/tenants/:id(.:format)      tenants#update
                     PUT    /properties/:property_id/tenants/:id(.:format)      tenants#update
                     DELETE /properties/:property_id/tenants/:id(.:format)      tenants#destroy
          properties GET    /properties(.:format)                               properties#index
                     POST   /properties(.:format)                               properties#create
        new_property GET    /properties/new(.:format)                           properties#new
       edit_property GET    /properties/:id/edit(.:format)                      properties#edit
            property GET    /properties/:id(.:format)                           properties#show
                     PATCH  /properties/:id(.:format)                           properties#update
                     PUT    /properties/:id(.:format)                           properties#update
                     DELETE /properties/:id(.:format)                           properties#destroy
{% endcodeblock %}

Much better! This routing structure allows us to access our list of properties at /properties, a specific property at /properties/:id, a list of a properties Tenants at /properties/:property_id/tenants, and a specific tenant at /properties/:property_id/tenants/:id.  This now models the relationship we've created between properties and Tenants.  The only problem now is that our tenant controller does not know how to use the :property_id parameter correctly to set our scope.  We need to make a few modifications to make use of the provided property_id.  The majority of our changes are in 'index' and 'new'.

``` ruby tenants_controller.rb
class TenantsController < ApplicationController
  def index
    @tenants = Tenant.find_all_by_property_id(params[:property_id])
  end

  def new
    @tenant = Tenant.new({property_id: params[:property_id]})
  end
end
```

You can see from the code above that we are now using the property_id parameter provided by our route to inform ActiveRecord of the scope of our search as well as initializing new models.  Hooray! But this isn't the goal we are looking for.  What we want is the ability to see Tenants in both the context of a property, but also, to view Tenants without any context.  This will allow us to view all our Tenants without regard to what Property they are assigned to, and provide a Tenant details path without having to find through the Property relationship.  Lets start with adding the rout to our routes file:

``` ruby routes.rb
TestApp::Application.routes.draw do
  resources :tenants

  resources :properties do
    resources :tenants
  end
end
```

This gives us the following routes:

<% codeblock %>
              Prefix Verb   URI Pattern                                         Controller#Action
             tenants GET    /tenants(.:format)                                  tenants#index
                     POST   /tenants(.:format)                                  tenants#create
          new_tenant GET    /tenants/new(.:format)                              tenants#new
         edit_tenant GET    /tenants/:id/edit(.:format)                         tenants#edit
              tenant GET    /tenants/:id(.:format)                              tenants#show
                     PATCH  /tenants/:id(.:format)                              tenants#update
                     PUT    /tenants/:id(.:format)                              tenants#update
                     DELETE /tenants/:id(.:format)                              tenants#destroy
    property_tenants GET    /properties/:property_id/tenants(.:format)          tenants#index
                     POST   /properties/:property_id/tenants(.:format)          tenants#create
 new_property_tenant GET    /properties/:property_id/tenants/new(.:format)      tenants#new
edit_property_tenant GET    /properties/:property_id/tenants/:id/edit(.:format) tenants#edit
     property_tenant GET    /properties/:property_id/tenants/:id(.:format)      tenants#show
                     PATCH  /properties/:property_id/tenants/:id(.:format)      tenants#update
                     PUT    /properties/:property_id/tenants/:id(.:format)      tenants#update
                     DELETE /properties/:property_id/tenants/:id(.:format)      tenants#destroy
          properties GET    /properties(.:format)                               properties#index
                     POST   /properties(.:format)                               properties#create
        new_property GET    /properties/new(.:format)                           properties#new
       edit_property GET    /properties/:id/edit(.:format)                      properties#edit
            property GET    /properties/:id(.:format)                           properties#show
                     PATCH  /properties/:id(.:format)                           properties#update
                     PUT    /properties/:id(.:format)                           properties#update
                     DELETE /properties/:id(.:format)                           properties#destroy
<% endcodeblock %>

Now we have both root access to our Tenants as well as routes through our properties relationship! Success! Well, not yet.  If we use any of the root routes to Tenants, our controller is going to throw an error, as property_id is not being sent along.  Let's fix that right now:

``` ruby tenants_controller.rb
class TenantsController < ApplicationController
  def index
    @tenants = params[:property_id].nil? ? Tenant.all : Tenant.find_all_by_property_id(params[:property_id])
  end

  def new
    @tenant = params[:property_id].nil? ? Tenant.new : Tenant.new({property_id: params[:property_id]})
  end
end
```

Now we can declare success. We now have the ability to access all our Tenants through a root route, as well as through their defined relationship through Properties using a nested route.