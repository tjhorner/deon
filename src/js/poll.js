function transformMixContest(obj){
  obj = obj || {}
  obj.pollId = '5820db412b27002175be50ff'
  return obj
}

function transformMixContestPoll(obj){
  obj.audioLink = 'http://nicolasjaar.net/works/mixes/BBC%20-%20Essential%20Mix.mp3'
  obj.tournamentImage = '/img/tournament-1.jpg'
  obj.endDate = new Date('2016-11-12T00:00:00') // UTC = PST + 8
  obj.cover = "/img/mixcontest.jpg" 

  var choices = []
  for (var i = 0; i<obj.choices.length; i++){
    choices.push({
      'index': i, 
      'choice': obj.choices[i]
    })
  }
  obj.choices = choices
  return obj
}

function createVote (e, el) {
  if (!isSignedIn()) 
    return toasty(Error('You need to <a href="/signin">sign in</a> to vote (it\'s free).'), 3000)

  var data = getTargetDataSet(el)
  if (!data || !data.pollId)
    return toasty(Error('There was an error. Please try again later.'))
  if (!data["choices[]"])
    return toasty(Error('You need to select at least an option.'))
  choices = []
  for (var i = 0; i<data["choices[]"].length; i++){
    var value = data["choices[]"][i]
    if (value) {
      var index = value.replace('choice-', '')
      choices.push(index)
    }
  }
  var maxVotes = 2;
  if (choices.length > maxVotes) 
    return toasty(Error('You may only select up to ' + maxVotes + ' choices.'))

  requestJSON({
    url: endpoint + '/vote',
    method: 'POST',
    data: {
      pollId: data.pollId,
      choices: choices
    },
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return toasty(Error(err.message))
    else {
      toasty("Success, your vote has been submitted.")
      el.classList.add('already-voted')
      el.innerHTML = 'Thank you!'

      var choicesEl = getDataSetTargetElement(el)
      choicesEl.classList.add('already-voted')
    }
  })
}

/* admin functions */

function isPollManager(){
  if (!isSignedIn()) return false
  return session.user.type.indexOf('poll_manager') > -1
}

function transformPoll(obj){
  obj = obj || {}
  obj.hasPollAccess = isPollManager()
  return obj
}

function createPoll (e, el) {
  var data = getTargetDataSet(el)
  if (!data || !data.question || !data["choices[]"]) return
  var choices = data["choices[]"].filter(function(v){return v!==''})
  requestJSON({
    url: endpoint + '/poll',
    method: 'POST',
    data: {
      question: data.question,
      choices: choices,
      multiChoice: data.multiChoice || false,
      multiVote: data.multiVote || false
    },
    withCredentials: true
  }, function (err, obj, xhr) {
    if (err) return window.alert(err.message)
    else {
      toasty('<span class="pointer-events">Success, your new Poll has been created with id: ' + obj._id + '.</span>', 5000)
    }
  })
}

function addChoice (e, el){
  var table = document.querySelector("[role=create-poll-table]")
  var counter = table.querySelectorAll(".choice").length
  var el = createChoice(counter+1)
  table.appendChild(el)
}

function createChoice (number) {
  var table = document.createElement('table')
  var template = getTemplateEl('poll-choice')
  render(table, template.textContent, {number: number})
  return table.firstElementChild.firstElementChild
}
