var Slack = require('slack-node');
webhookUri = "https://hooks.slack.com/services/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";
slack = new Slack();
slack.setWebhook(webhookUri);
module.exports = {
		setSlackMessage : function(slackMessage) {
			slack.webhook({
				  channel: "#managed-meetings-app",
				  username: "CMMA",
				  text: slackMessage,
				  icon_emoji: ":certain:",
				}, function(err, response) {
				   console.log(response);
				});
		}
}
