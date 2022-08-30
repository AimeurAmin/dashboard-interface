const baseurl = 'http://127.0.0.1:8000';
var myInit = { method: 'GET',
            //    headers: myHeaders,
               mode: 'cors',
               cache: 'default' };
							 
var step = 0;
var questions = [];
var wilayas = [];
var domains = [];
var userAnswers = [];
var classification = '';
  
if (window.fetch) {
	fetch(baseurl+'/QuestionModel/', myInit).then(async (data) => {
		questions = await data.json();
		console.log(questions);
		getCurrentQuestionAndAnswers();
	}).catch((e) => {
		console.log(e);
		document.getElementById('answers-container').append('Il semble qu\'il est impossible de contacter le serveur! verifier que votre serveur django est encours d\'execution ou qu\'il n\'a pas craché!');
	})

	fetch(baseurl+'/CityModel/', myInit).then(async (data) => {
		wilayas = await data.json()
		// wilayas = [{city_code: '', city_name: '', id: -1}, ...wilayas]
		console.log(wilayas);
		getCurrentWilayas();
	})

	fetch(baseurl+'/DomainModel/', myInit).then(async (data) => {
		domains = await data.json()
		console.log(domains);
		getDomains();
	})
} else {
	document.getElementById('answers-container').appendChild('Error de Fetch');
}

function makeRadioButton(name, value, text, index) {
	var radio = document.createElement("input");
	radio.type = "radio";
	radio.name = name;
	radio.value = value;
	if(index === 0) {
		radio.checked = true;
	}
	var label = document.createElement("label");
	label.className = "answer";
	label.appendChild(radio);
	label.appendChild(document.createTextNode(text));

	return label;
}

function makeOption(value, text) {
	var option = document.createElement("option");
    option.value = value;
    option.text = text;

	return option;
}

function getDomains() {
	var domainSelect  = document.getElementById('domain');
	// domainSelect.innerHTML = ''
	domains.map(domain => {
		domainSelect.appendChild(makeOption(domain.id, domain.domain_name));
	})
}

function getCurrentQuestionAndAnswers() {
	document.getElementById('question').innerHTML = questions[step].question.toString();
	const answersContent = document.getElementById('answers-container');
	answersContent.innerHTML = '';
	questions[step].answers.map((answer, index) => {
		var radioButton = makeRadioButton("answerRadio", answer.id, answer.answer, index);
		answersContent.appendChild(radioButton);
	})
}

function getCurrentWilayas() {
	var citySelect  = document.getElementById('city');
	// citySelect.innerHTML = ''
	wilayas.map(wilaya => {
		citySelect.appendChild(makeOption(wilaya.id, wilaya.city_code + ' - ' +wilaya.city_name));
	})
}

async function nextStep() {
	document.getElementById('previous').style.display = 'block'
	if(step < questions.length - 1) {
		// SELECTED RADIO BUTTON-------------------------------------------------------
		const userAnswer = document.querySelector('input[name="answerRadio"]:checked').value 
		console.log('setp: ' + step);
		console.log(userAnswer);
		userAnswers[step] = parseInt(userAnswer)
		// ----------------------------------------------------------------------------
		step ++;
		getCurrentQuestionAndAnswers();
	} else if (step === questions.length - 1) {
		// SELECTED RADIO BUTTON-------------------------------------------------------
		const userAnswer = document.querySelector('input[name="answerRadio"]:checked').value 
		console.log('setp: ' + step);
		console.log(userAnswer);
		userAnswers[step] =  parseInt(userAnswer)
		// ----------------------------------------------------------------------------
		step ++;
		document.getElementById('answers-container').style.display = 'none';
		document.getElementById('question').style.display = 'none';
		document.getElementById("comment-section").style.display = 'block';
	} else if(step === questions.length) {
		
		// TYPED COMMENT-----------------------------------------
		const comment = document.getElementById('comment').value;
		console.log(document.getElementById("comment").value);
		// ------------------------------------------------------
		document.getElementById('loading').style.display = 'flex'
		const response = await classifyComment(comment);		
		document.getElementById('loading').style.display = 'none'

		step ++;
		console.log(response);
		document.getElementById("comment-section").style.display = 'none';
		document.getElementById('user-form').style.display = 'block';
		document.getElementById('next').style.display = 'none';
		document.getElementById('submit').style.display = 'block';
	}
}


function previousStep() {

	document.getElementById('next').style.display = 'block';
	document.getElementById('submit').style.display = 'none';
	if(step === questions.length + 1) {
		step --;
		document.getElementById('user-form').style.display = 'none';
		document.getElementById("comment-section").style.display = 'block';
	} else if(step === questions.length  ) {
		step--;
		document.getElementById('user-form').style.display = 'none'
		document.getElementById("comment-section").style.display = 'none';
		document.getElementById('answers-container').style.display = 'flex';
		document.getElementById('question').style.display = 'flex';
	} else if(step > 0) {
		step --;
		getCurrentQuestionAndAnswers();
	}

	if(step === 0) {
		document.getElementById('previous').style.display = 'none';
	}
}


// CLASSIFY THE COMMENT
async function classifyComment(comment) {
	var response = '';
	const myHeaders = {
		...myInit, 
		method: 'POST', 
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		  },
		  body: JSON.stringify({comment})
	}
	await fetch(baseurl + '/CommentModel/classify/', myHeaders).then(async (data) => {
		response = await data.json();
		console.log(response);
		classification = response.result;
	}).catch(e => {
		console.error('something went wrong with the request to the classifier! => check the log below: \n' + e);
	})

	return response
}

document.getElementById('phone').addEventListener('input', e => {
	if(e.target.value.length >= 6) {
		e.target.value = '+213 5' + e.target.value.replace('+213 5', '')
	} else {
		e.target.value = '+213 5'
	}
})

// POST USER_ANSWER
async function postUserAnswer(answerId, userId, commentId) {
	const myHeaders = {
		...myInit, 
		method: 'POST', 
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		  },
		body: JSON.stringify({
			answer: answerId,
			user: userId,
			comment: commentId
		})
	}
	await fetch(baseurl + '/UserAnswerModel/', myHeaders).then((response) => {
		const data = response.json();
		console.log(data);
	}).catch(e => {
		console.error('Erreur lors de l\'appel au route UserAnswerModel! veuillez verifier la log suivante: \n' + e);
		throw new Error(e)
	})
}

// POST COMMENT
async function postComment(comment, calssification, domain, user) {
	const myHeaders = {
		...myInit, 
		method: 'POST', 
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		  },
		body: JSON.stringify({
			comment,
			calssification,
			domain,
			user
		})
	};
	await fetch(baseurl + '/CommentModel/', myHeaders).then(async (response) => {
		const commentData = await response.json()
		console.log(commentData);
		userAnswers.map(async answer => {
			// POST UserAnswer TO DJANGO
			return await postUserAnswer(answer, user, commentData.id);
		})
	}).catch((e) => {
		console.error('something went very wrong with the request to the CommentModel route! => check the log below: \n' + e);
		throw new Error(e);
	})
}

// Submit data
async function submit(userAnswers) {
	const firstName = document.getElementById("first-name");
	const lastName = document.getElementById("last-name");
	let phone = document.getElementById("phone");
	const email = document.getElementById("email");
	const wilaya = document.getElementById("city");
	console.log(userAnswers);

	if(firstName.value && lastName.value && phone && email && wilaya) {
		const myHeaders = {
			...myInit, 
			method: 'POST', 
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			  },
			body: JSON.stringify()
		}
		// SAVES DATA
		await fetch(baseurl + '/UserModel/', {
			...myHeaders, 
			body: JSON.stringify({
				first_name: firstName.value,
				last_name: lastName.value,
				phone: phone.value,
				email: email.value,
				city: 2
			})
		}).then(async function (data) {
			response = await data.json();
			const comment = document.getElementById('comment').value;

			var domain  = parseInt(document.getElementById('domain').value);
			
			const user = response.id

			return await postComment(comment, classification, domain, user);

		}).catch(e => {
			console.error('something went wrong with the request to UserModel route! => check the log below: \n' + e);
			throw Error(e);
		})
		return;
	}
	if(!firstName.value) {
		emptyFieldWarning(firstName);
		fieldEventListener(firstName);
	}
	if(!lastName.value) {
		emptyFieldWarning(lastName);
		fieldEventListener(lastName);
	}
	phone.value = phone.value.replace('\.', '');
	phone.value = phone.value.replaceAll('e', '');
	if(phone.value.length < 14 || isNaN(parseFloat(+phone.value.replace('+213 5', '')))) {
		emptyFieldWarning(phone);
		fieldEventListener(phone);
	}
	if(!email.value) {
		emptyFieldWarning(email);
		fieldEventListener(email);
	}
	if(wilaya.value === -1) {
		emptyFieldWarning(wilaya);
		fieldEventListener(wilaya);
	}
}

function fieldEventListener(field) {
	field.addEventListener('input', e => {
		field.classList.remove('danger')
	})
}

function emptyFieldWarning(field) {
	field.classList.add('danger')
}

// BUTTONS EVENT LISTENERS

document.getElementById('next').addEventListener('click', e => {
	nextStep();
})

document.getElementById('previous').addEventListener('click', e => {
	previousStep();
})

document.getElementById('submit').addEventListener('click', async e => {
	const response = await submit(userAnswers);
	console.log(response);
})

