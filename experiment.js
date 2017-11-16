/* ************************************ */
/* Define helper functions */
/* ************************************ */

function evalAttentionChecks() {
	var check_percent = 1
	if (run_attention_checks) {
		var attention_check_trials = jsPsych.data.getTrialsOfType('attention-check')
		var checks_passed = 0
		for (var i = 0; i < attention_check_trials.length; i++) {
			if (attention_check_trials[i].correct === true) {
				checks_passed += 1
			}
		}
		check_percent = checks_passed / attention_check_trials.length
	}
	return check_percent
}

function assessPerformance() {
	/* Function to calculate the "credit_var", which is a boolean used to
	credit individual experiments in expfactory. 
	 */
	var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
	var missed_count = 0
	var trial_count = 0
	var rt_array = []
	var rt = 0
	//record choices participants made
	var choice_counts = {}
	choice_counts[-1] = 0
	for (var k = 0; k < choices.length; k++) {
		choice_counts[choices[k]] = 0
	}
	for (var i = 0; i < experiment_data.length; i++) {
		if (experiment_data[i].possible_responses != 'none') {
			trial_count += 1
			rt = experiment_data[i].rt
			key = experiment_data[i].key_press
			choice_counts[key] += 1
			if (rt == -1) {
				missed_count += 1
			} else {
				rt_array.push(rt)
			}
		}
	}
	//calculate average rt
	var avg_rt = -1
	if (rt_array.length !== 0) {
		avg_rt = math.median(rt_array)
	} 
		//calculate whether response distribution is okay
	var responses_ok = true
	Object.keys(choice_counts).forEach(function(key, index) {
		if (choice_counts[key] > trial_count * 0.85) {
			responses_ok = false
		}
	})
	var missed_percent = missed_count/trial_count
	credit_var = (missed_percent < 0.4 && avg_rt > 200 && responses_ok)
	jsPsych.data.addDataToLastTrial({"credit_var": credit_var})

}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}
var trial_ms        = 4000;
var arrow_cue_ms    = 300;
var asterisk_cue_ms = 100;
var fixation_ms     = 400;
var post_trial_gap = function() {
	var curr_trial = jsPsych.progress().current_trial_global;
	var cue_ms = jsPsych.data.getData()[curr_trial-3].stim_duration;
	return trial_ms - cue_ms - fixation_ms - jsPsych.data.getData()[curr_trial - 1].block_duration - jsPsych.data.getData()[curr_trial - 4].block_duration
}

var getInstructFeedback = function() {
	return '<div class = centerbox><p class = center-block-text>' + feedback_instruct_text +
		'</p></div>'
}



/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// generic task variables
var run_attention_checks = false
var attention_check_thresh = 0.65
var sumInstructTime = 0 //ms
var instructTimeThresh = 0 ///in seconds
var credit_var = true

// task specific variables
/* set up stim: location (2) * cue (3) * predictive (2) * 5 (.8 for congruent directional) */
var locations = ['left', 'right']
var cues = ['center','centerleft','centerright','spatialleft','spatialright']
var current_trial = 0
var exp_stage = 'practice'
var test_stimuli = []
var choices = { left: 37, right: 39} // 37 = left arrow, 39 = right arrow


for (ci = 0; ci < cues.length; ci++) {
	var c = cues[ci];
	if (c == 'center' || c == 'spatialleft' || c == 'spatialright') {
		right = 5;
		left  = 5;
	} else if (c == 'centerleft') {
		left  = 8;
		right = 2;
	} else if (c == 'centerright') {
		right = 8;
		left  = 2;
	}
	for (i = 1; i <= right; i++) {
		stim = {
			stimulus: '<div class=centerbox><div class=orienting_text>+</div></div><div class=centerbox><div class=orienting_right><div class=orienting_text>&#9632</div></div></div>',
			data: {
				location: 'right',
				correct_response: choices['right'],
				cue: c, 
				trial_id: 'stim'
			}
		}
		test_stimuli.push(stim)
	}
	for (i = 1; i <= left; i++) {
		stim = {
			stimulus: '<div class=centerbox><div class=orienting_text>+</div></div><div class=centerbox><div class=orienting_left><div class=orienting_text>&#9632</div></div></div>',
			data: {
				location: 'left',
				correct_response: choices['left'],
				cue: c, 
				trial_id: 'stim'
			}
		}
		test_stimuli.push(stim)
	}
}

/* practice block */
var practice_block = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);

/* test blocks */
var block1_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var block2_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var block3_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var block4_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var block5_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var block6_trials = jsPsych.randomization.repeat($.extend(true, [], test_stimuli), 1, true);
var blocks = [block1_trials, block2_trials, block3_trials, block4_trials, block5_trials, block6_trials]

/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */
// Set up attention check node
var attention_check_block = {
	type: 'attention-check',
	timing_response: 180000,
	response_ends_trial: true,
	timing_post_trial: 200
}

var attention_node = {
	timeline: [attention_check_block],
	conditional_function: function() {
		return run_attention_checks
	}
}

//Set up post task questionnaire
var post_task_block = {
   type: 'survey-text',
   data: {
       trial_id: "post task questions"
   },
   questions: ['<p class = center-block-text style = "font-size: 20px">Please summarize what you were asked to do in this task.</p>',
              '<p class = center-block-text style = "font-size: 20px">Do you have any comments about this task?</p>'],
   rows: [15, 15],
   columns: [60,60]
};

/* define static blocks */
var test_intro_block = {
	type: 'poldrack-text',
	text: '<div class = centerbox><p class = center-block-text>We will now start the test. Press <strong>enter</strong> to begin.</p></div>',
	cont_key: [13],
	data: {
		trial_id: "intro",
		exp_stage: "test"
	},
	timing_response: 180000,
	timing_post_trial: 1000,
	on_finish: function() {
		exp_stage = 'test'
	}
};

var end_block = {
	type: 'poldrack-text',
	text: '<div class = centerbox><p class=center-block-text>Thanks for completing this task!</p><p class=center-block-text>Press <strong>enter</strong> to continue.</p></div>',
	cont_key: [13],
	data: {
		trial_id: "end",
    	exp_id: 'attention_orienting'
	},
	timing_response: 180000,
	timing_post_trial: 0,
	on_finish: assessPerformance
};

var feedback_instruct_text =
	'Welcome to the experiment. This experiment will take about 30 minutes. Press <strong>enter</strong> to begin.'
var feedback_instruct_block = {
	type: 'poldrack-text',
	cont_key: [13],
	text: getInstructFeedback,
	data: {
		trial_id: 'instruction'
	},
	timing_post_trial: 0,
	timing_response: 180000
};
/// This ensures that the subject does not read through the instructions too quickly.  If they do it too quickly, then we will go over the loop again.
var instructions_block = {
	type: 'poldrack-instructions',
	pages: [
		'<div class = centerbox><p class = block-text>In this experiment you will see a black square (&#9632) presented randomly towards the left or right of the screen.</p><p class=block-text>Your job is to indicate whether the square appears on the left or right by pressing the corresponding arrow key.</p></div>',
		'<div class = centerbox><p class = block-text>Before the &#9632 appears, a *, &larr;, or &rarr; will come up somewhere on the screen.  The arrows (&larr; and &rarr;) predict where square will appear.  Ignore the * as it makes detecting the square more difficult.</p><p class=block-text>Irrespective of where the *, &larr;, or &rarr; appear, it is important that you respond as quickly and accurately as possible by pressing the arrow key corresponding to the location of &#9632.</p></div>',
		'<div class = centerbox><p class = block-text><b><em>Try to let go of any thoughts or feelings that you notice which are not related to the task.  This should induce a meditative state which will improve your speed and accuracy.</em></b></p><p class=block-text>After you click <b>End Instructions</b> we will start with practice. During practice you will receive feedback about whether your responses are correct. You will not receive feedback during the rest of the experiment.</p></div>'
	],
	allow_keys: false,
	data: {
		trial_id: 'instruction'
	},
	show_clickable_nav: true,
	timing_post_trial: 1000
};

var instruction_node = {
	timeline: [feedback_instruct_block, instructions_block],
	/* This function defines stopping criteria */
	loop_function: function(data) {
		for (i = 0; i < data.length; i++) {
			if ((data[i].trial_type == 'poldrack-instructions') && (data[i].rt != -1)) {
				rt = data[i].rt
				sumInstructTime = sumInstructTime + rt
			}
		}
		if (sumInstructTime <= instructTimeThresh * 1000) {
			feedback_instruct_text =
				'Read through instructions too quickly.  Please take your time and make sure you understand the instructions.  Press <strong>enter</strong> to continue.'
			return true
		} else if (sumInstructTime > instructTimeThresh * 1000) {
			feedback_instruct_text = 'Done with instructions. Press <strong>enter</strong> to continue.'
			return false
		}
	}
}

var rest_block = {
	type: 'poldrack-text',
	text: '<div class = centerbox><p class=block-text>Take a break! Press any key to continue.</p></div>',
	timing_response: 180000,
	data: {
		trial_id: "rest block"
	},
	timing_post_trial: 1000
};

var fixation = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_text>+</div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'fixation'
	},
	timing_post_trial: 0,
	timing_stim: fixation_ms,
	timing_response: fixation_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}

// FIXME: Cues _detect_ anticipatory responses, but don't test their accuracy.  This would need a 'correct_response' attribute on cue data as per stimuli.

var center_cue = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_centercue_text>*</div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'centercue'
	},
	timing_post_trial: 0,
	timing_stim: asterisk_cue_ms,
	timing_response: asterisk_cue_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}
var center_left_cue = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_centercue_text>&larr;</div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'centerleftcue'
	},
	timing_post_trial: 0,
	timing_stim: arrow_cue_ms,
	timing_response: arrow_cue_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}
var center_right_cue = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_centercue_text>&rarr;</div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'centerrightcue'
	},
	timing_post_trial: 0,
	timing_stim: arrow_cue_ms,
	timing_response: arrow_cue_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}
var spatial_left_cue = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_text>+</div></div><div class=centerbox><div class=orienting_left' + 
				'><div class=orienting_text>*</div></div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'spatialleftcue'
	},
	timing_post_trial: 0,
	timing_stim: asterisk_cue_ms,
	timing_response: asterisk_cue_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}
var spatial_right_cue = {
	type: 'poldrack-single-stim',
	stimulus: '<div class=centerbox><div class=orienting_text>+</div></div><div class=centerbox><div class=orienting_right' + 
				'><div class=orienting_text>*</div></div></div>',
	is_html: true,
	choices: Object.values(choices),
	data: {
		trial_id: 'spatialrightcue'
	},
	timing_post_trial: 0,
	timing_stim: asterisk_cue_ms,
	timing_response: asterisk_cue_ms,
	response_ends_trial: false,
	on_finish: function() {
		jsPsych.data.addDataToLastTrial({
			exp_stage: exp_stage
		})
	}
}

/* set up experiment */
var attention_orienting_experiment = [];
attention_orienting_experiment.push(instruction_node);

/* set up practice */
var trial_num = 0
var block = practice_block
for (i = 0; i < block.data.length; i++) {
	var trial_num = trial_num + 1
	var first_fixation_gap = Math.floor(Math.random() * 1200) + 400;  // min = 400, max = 1600
	var first_fixation = {
		type: 'poldrack-single-stim',
		stimulus: '<div class=centerbox><div class=orienting_text>+</div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: 'fixation',
			exp_stage: 'practice'
		},
		timing_post_trial: 0,
		timing_stim: first_fixation_gap,
		timing_response: first_fixation_gap
	}
	attention_orienting_experiment.push(first_fixation)

	if (block.data[i].cue == 'center') {
		attention_orienting_experiment.push(center_cue)
	} else if (block.data[i].cue == 'centerleft') {
		attention_orienting_experiment.push(center_left_cue)
	} else if (block.data[i].cue == 'centerright') {
		attention_orienting_experiment.push(center_right_cue)
	} else if (block.data[i].cue == 'spatialleft') {
		attention_orienting_experiment.push(spatial_left_cue)
	} else if (block.data[i].cue == 'spatialright') {
		attention_orienting_experiment.push(spatial_right_cue)
	}

	attention_orienting_experiment.push(fixation)

	block.data[i].trial_num = trial_num
	var attention_orienting_task_practice_trial = {
		type: 'poldrack-categorize',
		stimulus: block.stimulus[i],
		is_html: true,
		key_answer: block.data[i].correct_response,
		correct_text: '<div class = centerbox><div style="color:green"; class = center-text>Correct!</div></div>',
		incorrect_text: '<div class = centerbox><div style="color:red"; class = center-text>Incorrect</div></div>',
		timeout_message: '<div class = centerbox><div class = center-text>Respond faster!</div></div>',
		choices: Object.values(choices),
		data: block.data[i],
		timing_response: 1700,
		timing_stim: 1700,
		response_ends_trial: true,
		timing_feedback_duration: 1000,
		show_stim_with_feedback: false,
		timing_post_trial: 0,
		on_finish: function() {
			jsPsych.data.addDataToLastTrial({
				exp_stage: exp_stage
			})
		}
	}

	attention_orienting_experiment.push(attention_orienting_task_practice_trial)

	var last_fixation = {
		type: 'poldrack-single-stim',
		stimulus: '<div class=centerbox><div class=orienting_text>+</div></div>',
		is_html: true,
		choices: 'none',
		data: {
			trial_id: 'fixation',
			exp_stage: 'practice'
		},
		timing_post_trial: 0,
		timing_stim: post_trial_gap,
		timing_response: post_trial_gap,
	}
	attention_orienting_experiment.push(last_fixation)
}
attention_orienting_experiment.push(rest_block)
attention_orienting_experiment.push(test_intro_block);


/* Set up main task */
var trial_num = 0
for (b = 0; b < blocks.length; b++) {
	var block = blocks[b]
	for (i = 0; i < block.data.length; i++) {
		var trial_num = trial_num + 1
		var first_fixation_gap = Math.floor(Math.random() * 1200) + 400;
		var first_fixation = {
			type: 'poldrack-single-stim',
			stimulus: '<div class=centerbox><div class=orienting_text>+</div></div>',
			is_html: true,
			choices: 'none',
			data: {
				trial_id: "fixation",
				exp_stage: 'test'
			},
			timing_post_trial: 0,
			timing_stim: first_fixation_gap,
			timing_response: first_fixation_gap
		}
		attention_orienting_experiment.push(first_fixation)

		if (block.data[i].cue == 'center') {
			attention_orienting_experiment.push(center_cue)
		} else if (block.data[i].cue == 'centerleft') {
			attention_orienting_experiment.push(center_left_cue)
		} else if (block.data[i].cue == 'centerright') {
			attention_orienting_experiment.push(center_right_cue)
		} else if (block.data[i].cue == 'spatialleft') {
			attention_orienting_experiment.push(spatial_left_cue)
		} else if (block.data[i].cue == 'spatialright') {
			attention_orienting_experiment.push(spatial_right_cue)
		}

		attention_orienting_experiment.push(fixation)

		block.data[i].trial_num = trial_num
		var orienting_trial = {
			type: 'poldrack-single-stim',
			stimulus: block.stimulus[i],
			is_html: true,
			choices: Object.values(choices),
			data: block.data[i],
			timing_response: 1700,
			timing_stim: 1700,
			response_ends_trial: true,
			timing_post_trial: 0,
			on_finish: function(data) {
				correct = data.key_press === data.correct_response
				jsPsych.data.addDataToLastTrial({
					correct: correct,
					exp_stage: exp_stage
				})
			}
		}
		attention_orienting_experiment.push(orienting_trial)

		var last_fixation = {
			type: 'poldrack-single-stim',
			stimulus: '<div class=centerbox><div class=orienting_text>+</div></div>',
			is_html: true,
			choices: 'none',
			data: {
				trial_id: "fixation",
				exp_stage: 'test'
			},
			timing_post_trial: 0,
			timing_stim: post_trial_gap,
			timing_response: post_trial_gap,
		}
		attention_orienting_experiment.push(last_fixation)
	}
	attention_orienting_experiment.push(attention_node)
	attention_orienting_experiment.push(rest_block)
}
//attention_orienting_experiment.push(post_task_block)
attention_orienting_experiment.push(end_block)