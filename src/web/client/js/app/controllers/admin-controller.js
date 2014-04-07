(function() {
  "use strict";
  
  App.AdminIndexRoute = Ember.Route.extend({
    model: function() {
      return this.store.findAll('user');
    }
  });
  
  App.AdminNewController = Ember.ArrayController.extend({
    userTypes: [ "User", "Controller", "Admin" ],
    selectedUserType: 'User',
    selectedUsername: '',
    selectedPassword: '',
        
    actions: {
      cancelNewUser: function() {
        this.set('selectedUsername', "");
        this.set('selectedPassword', "");
      },
      createNewUser: function() {
        var username = this.get('selectedUsername');
        var password = this.get('selectedPassword');
        var type = this.get('selectedUserType').toLowerCase();

        console.log(username, password, type);
      
        this.store.createRecord('user', {
          username: username,
          password: password,
          type: type
        });
        
        this.set('selectedUsername', "");
        this.set('selectedPassword', "");
        
        this.transitionTo('admin');
      }
    }
  });
  
}());
