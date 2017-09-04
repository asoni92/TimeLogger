app.common.statusMessages = {};
app.common.statusMessages.message = jQuery();

app.common.statusMessages.showSuccess = function(message) {
	app.common.statusMessages.showMessage( message, 'confirmation');
};

app.common.statusMessages.showWarning = function(message) {
	app.common.statusMessages.showMessage( message, 'warning');
};

app.common.statusMessages.showError = function(message) {
	app.common.statusMessages.showMessage(message, 'error');
};

app.common.statusMessages.showMessage = function(content, classType, position) {
	position = typeof position !== 'undefined' ? position : 'barTop';
	showStatusMessage(content,classType,position);
};

function StatusMessage(message) {
	if (message !== undefined && message !== null && message.length > 0) {
		var type = 'success';
		var statusMessageLabel = 'common.statusMessages.' + type + '.label';
		
		this.title = i18nAdapter.translate(statusMessageLabel);
		this.content = message;
		this.classType = 'confirmation';
	} else {
		this.content = "";
	}
}

function showStatusMessage(message,type,position) {

    PNotify.prototype.options.styling = "fontawesome";
    PNotify.prototype.options.history = false;
    PNotify.prototype.options.delay = 3000;

	type = typeof type !== 'undefined' ? type : 'info';

    var pOpts = {
        text: message,
        stack : {
            "dir1" : "down",
            "dir2" : "right",
            "push" : "top",
            "spacing1" : 8,
            "spacing2" : 8
        },
        addclass: "stack-custom",
        width : "33%",
        opacity: 1,
        buttons: {
            closer_hover: true,
            sticker: false
        }
    };


    switch (type) {
    case ('error'):
        pOpts.title = "Error";
        pOpts.type = 'error';
        pOpts.icon = 'fa fa-warning fa-white';
        break;
    case ('warning'):
        pOpts.title = "Warning";
        pOpts.type = 'info';
        pOpts.icon = 'fa fa-warning fa-white';
        break;
    case ('loading'):
        pOpts.title = "Warning";
        pOpts.type = 'info';
        pOpts.icon = 'fa fa-spinner fa-white';
        hideLoading = false;
        break;
    case ('confirmation'):
        pOpts.title = "Success";
        pOpts.type = 'success';
        pOpts.icon = 'fa fa-check fa-white';
        break;
    default: pOpts.title = 'Information';
    }
    PNotify.removeAll();
    var notice = new PNotify(pOpts);
    notice.get().click(function() {
        notice.remove();
    });
}
