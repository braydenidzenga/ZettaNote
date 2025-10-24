/**
 * Mailer Controller
 * Handles email sending operations
 */

import { sendMail } from '../../mailers/resend.client.js';
import { STATUS_CODES } from '../../constants/statusCodes.js';
import { MESSAGES } from '../../constants/messages.js';
import logger from '../../utils/logger.js';

/**
 * Send Test/Generic Email
 * @param {object} req - Express request object
 * @returns {object} Response status and message
 */
export const sendTestMail = async (req) => {
  const { to, subject, html, text } = req.body || {};

  // Input validation
  if (!to || !subject) {
    return {
      resStatus: STATUS_CODES.BAD_REQUEST,
      resMessage: {
        success: false,
        message: 'Missing required fields: to and subject are required.',
      },
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = Array.isArray(to) ? to : [to];

  for (const email of emails) {
    if (!emailRegex.test(email)) {
      return {
        resStatus: STATUS_CODES.BAD_REQUEST,
        resMessage: {
          success: false,
          message: `Invalid email address: ${email}`,
        },
      };
    }
  }

  try {
    // Send email using Resend
    const result = await sendMail({ to, subject, html, text });

    if (result.success) {
      return {
        resStatus: STATUS_CODES.OK,
        resMessage: {
          success: true,
          message: 'Email sent successfully and queued for delivery.',
          id: result.id,
        },
      };
    }

    // Handle Resend API errors
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: 'Failed to send email.',
        error: result.message || 'Unknown error',
      },
    };
  } catch (error) {
    logger.error('Mailer error', error);
    return {
      resStatus: STATUS_CODES.INTERNAL_SERVER_ERROR,
      resMessage: {
        success: false,
        message: MESSAGES.GENERAL.INTERNAL_ERROR,
      },
    };
  }
};

/**
 * Send task reminder email
 * @description Sends reminder email for tasks approaching deadline
 * @param {object} task - Task object with populated owner
 * @param {string} timeUntil - Time until deadline (e.g., '1 hour')
 * @returns {object} Response status and message
 */
export const sendTaskReminderEmail = async (task, timeUntil) => {
  try {
    const subject = `⏰ Task Reminder: "${task.taskName}" due in ${timeUntil}`;
    const deadlineFormatted = new Date(task.taskDeadline).toLocaleString();

    const html = `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
	<title></title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css">
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; padding: 0; }
		a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
		#MessageViewBody a { color: inherit; text-decoration: none; }
		p { line-height: inherit }
		.desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
		.image_block img+div { display: none; }
		sup, sub { font-size: 75%; line-height: 0; }
		@media (max-width:700px) {
			.mobile_hide { display: none; }
			.row-content { width: 100% !important; }
			.stack .column { width: 100%; display: block; }
			.mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; }
			.desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; }
		}
	</style>
</head>
<body class="body" style="background-color: #f7f3ec; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f3ec;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 5px; vertical-align: top;">
													<div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
													<table class="heading_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<h1 style="margin: 0; color: #101010; direction: ltr; font-family: Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif; font-size: 50px; font-weight: 700; letter-spacing: normal; line-height: 1.2; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 60px;">⏰ Task Reminder: "${
                                  task.taskName
                                }"</h1>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:25px;padding-left:10px;padding-right:10px;padding-top:10px;">
																<div style="color:#101010;direction:ltr;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:1.5;text-align:left;mso-line-height-alt:27px;">
																	<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 16px 0;">
																		<h3 style="margin: 0 0 12px 0; color: #856404; font-family: Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;">Task: ${
                                      task.taskName
                                    }</h3>
																		${
                                      task.taskDescription
                                        ? `<p style="margin: 8px 0; color: #6c757d;"><strong>Description:</strong> ${task.taskDescription}</p>`
                                        : ''
                                    }
																		<p style="margin: 8px 0; color: #6c757d;"><strong>Deadline:</strong> ${deadlineFormatted}</p>
																		<p style="margin: 8px 0; color: #856404;"><strong>Time remaining:</strong> ${timeUntil}</p>
																	</div>
																	<p style="margin: 0; margin-bottom: 16px;">This is an automated reminder from <strong>ZettaNote</strong>. Your task deadline is approaching soon!</p>
																	<p style="margin: 0; margin-bottom: 16px;">Please log in to your <a href="https://www.zettanote.tech" target="_blank" style="text-decoration: underline; color: #7747ff;" rel="noopener"><strong>ZettaNote Dashboard</strong></a> to view and manage your tasks.</p>
																	<p style="margin: 0;">Stay organized and productive with ZettaNote!</p>
																</div>
															</td>
														</tr>
													</table>
													<div class="spacer_block block-4" style="height:5px;line-height:5px;font-size:1px;">&#8202;</div>
													<div class="spacer_block block-5" style="height:40px;line-height:40px;font-size:1px;">&#8202;</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0d0b0e;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<table class="menu_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="alignment" style="text-align:center;font-size:0px;">
																			<div class="menu-links">
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Features</a>
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Services</a>
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Policy</a>
																			</div>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</body>
</html>
    `;

    const text = `
Task Reminder: "${task.taskName}" due in ${timeUntil}

${task.taskDescription ? `Description: ${task.taskDescription}` : ''}
Deadline: ${deadlineFormatted}
Time remaining: ${timeUntil}

This is an automated reminder from ZettaNote.
    `;

    const result = await sendMail({
      to: task.owner.email,
      subject,
      html,
      text,
    });

    if (result.success) {
      logger.info(`Reminder email sent successfully to ${task.owner.email} for task ${task._id}`);
      return {
        success: true,
        message: 'Reminder email sent successfully',
        id: result.id,
      };
    } else {
      logger.error(
        `Failed to send reminder email to ${task.owner.email} for task ${task._id}:`,
        result.error
      );
      return {
        success: false,
        message: 'Failed to send reminder email',
        error: result.error,
      };
    }
  } catch (error) {
    logger.error(`Error sending reminder email for task ${task._id}:`, error);
    return {
      success: false,
      message: 'Error sending reminder email',
      error: error.message,
    };
  }
};

/**
 * Send task overdue email
 * @description Sends notification email for overdue tasks
 * @param {object} task - Task object with populated owner
 * @returns {object} Response status and message
 */
export const sendTaskOverdueEmail = async (task) => {
  try {
    const subject = `🚨 Task Overdue: "${task.taskName}"`;
    const deadlineFormatted = new Date(task.taskDeadline).toLocaleString();
    const overdueDays = Math.floor(
      (new Date() - new Date(task.taskDeadline)) / (1000 * 60 * 60 * 24)
    );

    const html = `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
	<title></title>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css">
	<style>
		* { box-sizing: border-box; }
		body { margin: 0; padding: 0; }
		a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; }
		#MessageViewBody a { color: inherit; text-decoration: none; }
		p { line-height: inherit }
		.desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; }
		.image_block img+div { display: none; }
		sup, sub { font-size: 75%; line-height: 0; }
		@media (max-width:700px) {
			.mobile_hide { display: none; }
			.row-content { width: 100% !important; }
			.stack .column { width: 100%; display: block; }
			.mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; }
			.desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; }
		}
	</style>
</head>
<body class="body" style="background-color: #f7f3ec; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
	<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f7f3ec;">
		<tbody>
			<tr>
				<td>
					<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-size: auto; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-top: 5px; vertical-align: top;">
													<div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
													<table class="heading_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<h1 style="margin: 0; color: #dc3545; direction: ltr; font-family: Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif; font-size: 50px; font-weight: 700; letter-spacing: normal; line-height: 1.2; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 60px;">🚨 Task Overdue: "${
                                  task.taskName
                                }"</h1>
															</td>
														</tr>
													</table>
													<table class="paragraph_block block-3" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
														<tr>
															<td class="pad" style="padding-bottom:25px;padding-left:10px;padding-right:10px;padding-top:10px;">
																<div style="color:#101010;direction:ltr;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:18px;font-weight:400;letter-spacing:0px;line-height:1.5;text-align:left;mso-line-height-alt:27px;">
																	<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 16px 0;">
																		<h3 style="margin: 0 0 12px 0; color: #721c24; font-family: Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;">Task: ${
                                      task.taskName
                                    }</h3>
																		${
                                      task.taskDescription
                                        ? `<p style="margin: 8px 0; color: #6c757d;"><strong>Description:</strong> ${task.taskDescription}</p>`
                                        : ''
                                    }
																		<p style="margin: 8px 0; color: #6c757d;"><strong>Was due:</strong> ${deadlineFormatted}</p>
																		<p style="margin: 8px 0; color: #721c24;"><strong>Overdue by:</strong> ${overdueDays} day${
                                      overdueDays !== 1 ? 's' : ''
                                    }</p>
																	</div>
																	<p style="margin: 0; margin-bottom: 16px;">This task is now <strong>overdue</strong>. Don't let it slip further!</p>
																	<p style="margin: 0; margin-bottom: 16px;">Please log in to your <a href="https://www.zettanote.tech" target="_blank" style="text-decoration: underline; color: #7747ff;" rel="noopener"><strong>ZettaNote Dashboard</strong></a> to complete or reschedule this task.</p>
																	<p style="margin: 0;">Stay on top of your tasks with ZettaNote!</p>
																</div>
															</td>
														</tr>
													</table>
													<div class="spacer_block block-4" style="height:5px;line-height:5px;font-size:1px;">&#8202;</div>
													<div class="spacer_block block-5" style="height:40px;line-height:40px;font-size:1px;">&#8202;</div>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
					<table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0d0b0e;">
						<tbody>
							<tr>
								<td>
									<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 680px; margin: 0 auto;" width="680">
										<tbody>
											<tr>
												<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
													<table class="menu_block block-1" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
														<tr>
															<td class="pad">
																<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
																	<tr>
																		<td class="alignment" style="text-align:center;font-size:0px;">
																			<div class="menu-links">
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Features</a>
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Services</a>
																				<a href="https://www.zettanote.tech" target="_blank" style="padding-top:5px;padding-bottom:5px;padding-left:20px;padding-right:20px;display:inline-block;color:#ffffff;font-family:Fira Sans, Lucida Sans Unicode, Lucida Grande, sans-serif;font-size:16px;text-decoration:none;letter-spacing:normal;">Policy</a>
																			</div>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>
												</td>
											</tr>
										</tbody>
									</table>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
</body>
</html>
    `;

    const text = `
Task Overdue: "${task.taskName}"

${task.taskDescription ? `Description: ${task.taskDescription}` : ''}
Was due: ${deadlineFormatted}
Overdue by: ${overdueDays} day${overdueDays !== 1 ? 's' : ''}

This task is now overdue. Please log in to your ZettaNote dashboard to complete or reschedule this task.
    `;

    const result = await sendMail({
      to: task.owner.email,
      subject,
      html,
      text,
    });

    if (result.success) {
      logger.info(`Overdue email sent successfully to ${task.owner.email} for task ${task._id}`);
      return {
        success: true,
        message: 'Overdue email sent successfully',
        id: result.id,
      };
    } else {
      logger.error(
        `Failed to send overdue email to ${task.owner.email} for task ${task._id}:`,
        result.error
      );
      return {
        success: false,
        message: 'Failed to send overdue email',
        error: result.error,
      };
    }
  } catch (error) {
    logger.error(`Error sending overdue email for task ${task._id}:`, error);
    return {
      success: false,
      message: 'Error sending overdue email',
      error: error.message,
    };
  }
};
