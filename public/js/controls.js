var player = new MusicPlayer()

var sel = {
  play: '[role="play"]',
  playPlaylist: '[role="play-playlist"]',
  playRelease: '[role="play-release"]',
  scrub: '[role="scrub-progress"]',
  title: '[role="track-title"]'
}

var playerEvents = {
  statechange: updateControls,
  play: onNewSong,
}

var playerAnalyticEvents = [
  'play',
  'stop',
  'pause',
  'next',
  'previous',
  'ended'
]

document.addEventListener('DOMContentLoaded', function(e) {
  var events = Object.keys(playerEvents)
  events.forEach(function (name) {
    player.addEventListener(name, playerEvents[name])
  })
  playerAnalyticEvents.forEach(function (name) {
    player.addEventListener(name, recordPlayerEvent)
  })
  player.addEventListener('error', recordPlayerError)
  player.addEventListener('play', recordPlayerPlayLegacy)
  requestAnimationFrame(updatePlayerProgress)
})

function recordPlayerEvent (e) {
  recordEvent('Deon AP ' + capitalizeFirstLetter(e.type), flattenObject(e.detail))
}

function recordPlayerError (e) {
  recordEvent('Deon AP Error', e)
}

function recordPlayerPlayLegacy (e) {
  recordEvent('Audio Player Play Server Side', e.detail.item)
}

function togglePlay(e, el) {
  player.toggle()
  updateControls()
}

function next(e, el) {
  player.next()
  updateControls()
}

function previous(e, el) {
  player.previous()
  updateControls()
}

function toggleRepeat(e, el) {
  var options = ['none', 'one', 'all']
  var i = (options.indexOf(player.repeat) + 1) % options.length
  player.repeat = options[i]

  el.classList.toggle('repeat-one', player.repeat == 'one')
  el.classList.toggle('repeat-all', player.repeat == 'all')
}

function toggleShuffle(e, el) {
  player.shuffle = !player.shuffle
  el.classList.toggle('active', player.shuffle)
}

function playSong(e, el) {
  var index = el.hasAttribute('index') ? +el.getAttribute('index') : undefined
  if (index != undefined)
    loadAndPlayTracks(index)
}

function loadAndPlayTracks(index) {
  var tracks = buildTracks()
  if (areTracksLoaded(tracks)) {
    player.toggle(index)
  }
  else {
    player.set(tracks)
    player.play(index)

    var el = document.querySelector(sel.title)
    if (el) el.setAttribute('href', window.location.pathname + window.location.search)
  }

  updateControls()
}

function buildTracks() {
  var els = Array.prototype.slice.call(document.querySelectorAll('[play-link]'))
  return els.map(mapTrackElToPlayer)
}

function areTracksLoaded(tracks) {
  return tracks.every(function(track, index) {
    return player.items[index] && player.items[index].source == track.source
  })
}

function playSongs(e, el) {
  loadAndPlayTracks()
}

function onNewSong(e) {
  document.querySelector(sel.title).textContent = e.detail.item.title
}

function updateControls() {
  var playEl = document.querySelector(sel.play)
  if (playEl) {
    playEl.classList.toggle('fa-play', !player.playing && !player.loading)
    playEl.classList.toggle('fa-pause', player.playing)
    playEl.classList.toggle('fa-spin', player.loading && !player.playing)
    playEl.classList.toggle('fa-refresh', player.loading && !player.playing)
  }

  var buttons = document.querySelectorAll('[role="play-song"]')
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove('active')
  }

  var playing = player.playing || player.loading
  var item = player.items[player.index]
  var selector = '[role="play-song"][play-link="' + item.source + '"]'
  var el = item ? document.querySelector(selector) : undefined
  if (el) {
    el.classList.toggle('active', playing)
  }

  var pel = document.querySelector(sel.playPlaylist)
  if (pel) {
    var playlistPlaying = playing && !isPlaylistLoaded(pel.getAttribute('playlist-id'))
    pel.classList.toggle('fa-pause', playlistPlaying)
    pel.classList.toggle('fa-play', !playlistPlaying)
  }

  var rel = document.querySelector(sel.playRelease)
  if (rel) {
    rel.classList.toggle('active', playing && isReleaseLoaded(rel.getAttribute('release-id')))
  }
}

function isPlaylistLoaded(id) {
  return player.items.length && player.items[0].playlistId == id
}

function isReleaseLoaded(id) {
  return player.items.length && player.items[0].releaseId == id
}

function mapTrackElToPlayer (el) {
  return {
    source:     el.getAttribute('play-link'),
    skip:       isSignedIn() && !el.hasAttribute('licensable') && session.settings.hideNonLicensableTracks,
    title:      el.getAttribute('title'),
    trackId:    el.getAttribute('track-id'),
    playlistId: el.getAttribute('playlist-id'),
    releaseId:  el.getAttribute('release-id')
  }
}

function scrub(e, el) {
  if (e.clientY>100){
    var margin = 0
    if (document.body) margin = document.body.clientWidth - el.offsetWidth || 0
    player.seek((e.clientX - margin/2) / el.offsetWidth)
  } else{
    player.seek(e.clientX / el.offsetWidth)
  }
}

function updatePlayerProgress() {
  requestAnimationFrame(updatePlayerProgress)
  var scrubs = document.querySelectorAll(sel.scrub)
  if (scrubs) {
    for(var i = 0; i<scrubs.length; i++){
      scrubs[i].style.width = player.progress * 100 + '%'
    }
  }
}