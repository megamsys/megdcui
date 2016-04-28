import NotificationMessagesService from 'meg/services/notification-messages-service';

export default {
    name: 'notification-messages-service',

    initialize() {
        let application = arguments[1] || arguments[0];
        console.log("-----------------------");
        console.log(application);
        application.register('notification-messages:service', NotificationMessagesService);

        ['controller', 'component', 'route', 'router', 'service'].forEach(injectionTarget => {
            application.inject(injectionTarget, 'notifications', 'notification-messages:service');
        });
    }
};
