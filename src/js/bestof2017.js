var artistsToShow = 30;
var artistsToExclude = [
];

function transformBestOf2017Results (obj, done) {
  obj = obj || {};
  requestJSON({
    url: endpoint + '/poll/' + artistPollId + '/breakdown',
    withCredentials: true
  }, function (err, breakdown) {
    if(err) {
      return toasty(new Error(err));
    }
    obj.poll = breakdown.poll;
    transformBestOf2017Results.poll = obj.poll;

    //Map results to the choices in the poll
    var voteResults = breakdown.countsByIndex.map(function (votes, index) {
      return {
        artistId: obj.poll.choices[index],
        votes: votes
      }
    });

    voteResults = voteResults.filter(function (r) {
      return artistsToExclude.indexOf(r.artistId) == -1;
    })

    var artistIds = voteResults.map(function (result) {
      return result.artistId
    });

    requestJSON({
      url: endpoint + '/catalog/artists-by-users?ids=' + artistIds.join(','),
      withCredentials: true
    }, function (err, result) {
      if(err) {
        return toasty(new Error(err));
      }
      var atlas = {}
      result.results.forEach(function (result) {
        atlas[result._id] = result;
      })

      obj.results = voteResults.sort(function (a, b) {
        return a.votes > b.votes ? -1 : 1;
      })

      obj.results = obj.results .map(function (result, index) {
        result.artist = atlas[result.artistId];
        result.rank = index + 1;
        return result
      });

      obj.status = breakdown.status;
      obj.showThankYou = getCookie('hideBestOf2017ThankYou') != 'true' && breakdown.status.voted;
      obj.votedForTweet = getVotedForTweet(atlas, breakdown);
      obj.tweetIntentURL = getVotedForTweetIntentUrl(obj.votedForTweet);
      transformBestOf2017Results.artistsAtlas = atlas;
      //done(null, obj);
      var songPollIds = Object.keys(artistSongPolls).map(function (key) {
        return artistSongPolls[key];
      })
      requestJSON({
        url: endpoint + '/poll?ids=' + songPollIds.join(','),
        withCredentials: true
      }, function (err, result) {
        var songIds = result.results.reduce(function (ids, poll) {
          return ids.concat(poll.choices);
        }, []);
        requestJSON({
          url: endpoint + '/catalog/track?ids=' + songIds.join(','),
          withCredentials: true
        }, function (err, result) {
          transformBestOf2017Results.trackAtlas = result.results.reduce(function (atlas, track) {
            track.releaseId = track.albums[0].albumId;
            track.playUrl = getPlayUrl(track.albums, track.releaseId);
            track.downloadLink = getDownloadLink(track.releaseId, track._id);
            atlas[track._id] = track;
            return atlas;
          });
          done(null, obj);
        });
      })
    });
  });
}
transformBestOf2017Results.poll = {}
transformBestOf2017Results.trackAtlas = {}

function completedBestOf2017Results () {
  updateBestOf2017Results.lastUpdated = new Date().getTime();
  var timeout = null;
  var updateResults = function () {
    updateBestOf2017Results();
    clearTimeout(timeout);
    if(new Date(transformBestOf2017Results.poll.end) > new Date()) {
      timeout = setTimeout(updateResults, 120000);
    }
  }
  updateResults();

  var timeout2 = null;
  var updateTimeNotice = function () {
    var now = new Date().getTime();

    var diff = now - updateBestOf2017Results.lastUpdated;
    var diffS = diff / 1000;
    var updatedText = 'Last updated ';
    if(diffS < 10) {
      updatedText += 'just now';
    }
    else if(diffS < 60) {
      updatedText += 'less than a minute ago';
    }
    else if(diffS > 60) {
      var minutes = Math.round(diffS / 60);
      updatedText += minutes + ' minute' + (minutes == 1 ? '' : 's') + ' ago';
    }

    updatedText += '.';

    if(new Date(transformBestOf2017Results.poll.end).getTime() < now) {
      updatedText += ' Voting is closed.';
    }
    else {
      updatedText += ' Voting closes at ' + formatBestOf2017EndTime(transformBestOf2017Results.poll.end) + '.';
    }

    var el = document.querySelector("[role=last-updated]");
    el.innerHTML = updatedText;
    el.classList.toggle('hide', false);
    clearTimeout(timeout2);
    timeout2 = setTimeout(updateTimeNotice, 1000);
  }
  updateTimeNotice();


  window.addEventListener('popstate', function () {
    clearTimeout(timeout);
    clearTimeout(timeout2);
  });

  //Load background images
  var banners = document.querySelectorAll('.banner[background-image]');
  banners.forEach(function (bannerEl) {
    var img = new Image();
    img.onload = function () {
      bannerEl.style.backgroundImage = 'url(' + img.src + ')';
      bannerEl.classList.toggle('on', true);
    }
    img.src = bannerEl.getAttribute("background-image");
  })
}

/**
 * Grabs the vote results and updates the rank/votes/position of all the artists
 * displayed on the page.
 * They are all rendered on page load, and we hide/show them by manipulating
 * their css classes
 */
function updateBestOf2017Results () {
  requestJSON({
    url: endpoint + '/poll/' + artistPollId + '/breakdown',
    withCredentials: true
  }, function (err, result) {
    var results = result.countsByIndex.map(function (votes, index) {
      votes = (votes * 1000) + index; //+ Math.round(Math.random() * 10); //This is for testing
      return {
        artistId: result.poll.choices[index],
        votes: votes
      }
    })
    .sort(function (a, b) {
      if (a.votes == b.votes) return 0
      return a.votes > b.votes ? -1 : 1;
    })
    .filter(function (result, index) {
      return index < artistsToShow + 10; //To save memory I'm not dealing with anything beyond top 40
    })
    .map(function (result, index) {
      result.rank = index+1
      return result
    }).filter(function (result) {
      var sel = '.bestof2017-result[artist-id="' + result.artistId + '"]';
      var el = document.querySelector(sel);
      result.el = el;
      return el != null
    });

    //Update vote and rank text and CSS classes
    var missingRanks = 0;
    results.forEach(function (result, index) {
      var rank = result.rank;
      var el = result.el;
      if(!el) {
        missingRanks++;
        return;
      }

      var rank = index + 1 - missingRanks;
      if(isNaN(rank)) {
        console.warn('RANK NAN', result)
      }

      el.classList.toggle('top', rank <= artistsToShow);

      var votesEl = el.querySelector('[role=votes]');
      votesEl.innerHTML = result.votes + ' vote' + (result.votes == 1 ? '' : 's');

      console.log('rank', rank);
      updateArtistRowElRank(el, rank);
    });

    updateBestOf2017SongResults();
    updateBestOf2017Results.lastUpdated = new Date().getTime();
  });
}

function updateArtistRowElRank (el, rank) {
  var rankEl = el.querySelector('[role=rank]');
  rankEl.innerHTML = rank
  var cls = el.getAttribute('class');
  cls = cls.replace(/rank-[0-9]+/, '')
  cls += ' rank-' + rank;
  el.setAttribute('class', cls);
  el.setAttribute('rank', rank);
}

/**
 * Updates the top song of each of the top X artists on the page
 *
 */
function updateBestOf2017SongResults () {
  //We need to convert this to an array of objects so we can sort it
  //as the querySelectorAll returns an array that cannot be sorted
  var artistEls = document.querySelectorAll('.artist-row');
  var artistRows = [];
  artistEls.forEach(function (el) {
    //Sometimes the artist rows don't have an artist-id value
    //I don't know how this happens, or if SHOULD happen
    //  but I'm removing them from this
    if(el.getAttribute('artist-id').length > 0) {
      artistRows.push({
        rank: parseInt(el.getAttribute('rank')),
        el: el,
        artist: transformBestOf2017Results.artistsAtlas[el.getAttribute('artist-id')]
      });
    }
  });

  console.log('artistEls.length',artistEls.length);

  //Sort these elements by rank so that the index of the play buttons
  //can match up to their display order
  //Reminder: display order is dependent on a css class, not position in the HTML
  artistRows = artistRows.sort(function (el1, el2) {
    var r1 = el1.rank;
    var r2 = el2.rank;

    if(r1 == r2) {
      return 0
    }

    return r1 > r2 ? 1 : -1;
  })

  function doneLoading () {
    //Here we are updating the indexes of the play butons based on their
    //display order, which will match the order of artistRows since it was sorted above
    //Note: display order is based on classes, not position in HTML
    var trackIndex = 0;
    artistRows.forEach(function (ar, artistIndex) {
      if(ar.track) {
        var playButton = ar.el.querySelector('button[index][play-link]')
        if(playButton) {
          playButton.setAttribute('index', trackIndex);
          trackIndex++;
        }
        else {
        }
      }
    });


    if(tracksLoaded == tracksToLoad) {
      console.log('DONE LOADING', tracksLoaded, tracksToLoad);
      updateBestOf2017Results.artistRows = artistRows;



      var loadedTrackIds = [];
      var loadedTracks = [];
      var dupeTracks = false;
      var topSongIds = [];
      var topTracks = artistRows.map(function (ar) {
        return ar.track;
      })
      topTracks.forEach(function (t, index) {
        var ar = artistRows[index];
        console.log('ar.rank', ar.rank);
        //If this track has already been loaded higher up, then we need to replace it
        //  with the next song from this artist that hasn't already been loaded
        //If there are no suitable replacement songs, we have to remove that artist
        //  and then bring in a new artist. THEN we have to make sure that artist doesn't
        //  have any duplicate songs
        console.log('t.title', t.title, index);
        if(topSongIds.indexOf(t.trackId) >= 0) {
          console.log(t.title + ' is dupe at ', index, ' with artist ', ar.artist.name);
          dupeTracks = true;
          var artistRow = artistRows[index];
          nextTopSongIndex = 0;
          //Go through all this artist's songs until we find one not already loaded
          var nextTopSong;
          do {
            if(artistRow.topSongs && artistRow.trackAtlas && artistRow.topSongs[nextTopSongIndex]) {
              var nextTopSongId = artistRow.topSongs[nextTopSongIndex].songId;
              nextTopSong = artistRow.trackAtlas[nextTopSongId];
              nextTopSongIndex++;
            }
            else {
              nextTopSong = false;
            }
          }
          while(topSongIds.indexOf(nextTopSong._id) >= 0 && nextTopSong);

          if(!nextTopSong) {
            console.log('Demote this artist : ' + artistRow.artist.name);
            demoteArtistRow(artistRow);
          }
          else {
            console.warn('Replacing song for ' + ar.artist.name + ' with ', nextTopSong);
            topSongIds.push(nextTopSong._id);
            renderArtistRowTrack(artistRow, nextTopSong);
          }
        }
        else {
          topSongIds.push(t.trackId);
        }
      });



      //We need to clear out the player and rebuild its list of items
      //so that when it hits the end it plays the NEW next song
      //If you play song #5 and it moves to #3 before it's done
      //the next song to autoplay should be #4

      //Grab the tracks from the dom. Some new ones may have been added
      //These are sorted by the [index] property on the button
      var playableTracks = buildTracks();
      console.log('---'.repeat(20));
      playableTracks = playableTracks.map(function (track) {
        console.log('track', track);
        track.skip = false; //skip will hide unlicensable tracks from licensees, so we turn it off
        return track;
      })




      //If the player is currently playing or loading a song, we need to update the index of the player
      //to match the new position of the song, because it may have moved
      //We do this by going through the new list of songs built from the HTML until we
      //find the song that matches the trackId of what's currently in the player
      if(player.playing || player.loading) {
        var currentSong = player.items[player.index]
        var found = false;
        var newIndex = -1;
        for(var i = 0; i < tracks.length; i++) {
          var t = tracks[i];
          if(t.trackId == currentSong.trackId) {
            newIndex = i;
            found = true;
            break;
          }
        }

        player.index = newIndex;
        player.set(tracks);
        updateControls();
      }
    }
  }

  var tracksToLoad = artistsToShow;
  var artistsLoaded = 0;
  var tracksLoaded = 0;
  console.log('artistRows.length',artistRows.length);
  artistRows.forEach(function (ar, artistIndex) {
    var el = ar.el;
    var rank = ar.rank;
    var artistId = el.getAttribute('artist-id');
    if(!artistId) {
      console.log('No artist-id found for ', ar);
    }
    var songPollId = artistSongPolls[artistId];
    if(!songPollId) {
      console.log('No songPollId found for ' + artistId);
      return
    }

    //This prevents some unnecessary requests to the server
    //It isn't perfect because artistsLoaded is updated on response from server
    if(artistsLoaded > artistsToShow + 10) {
      console.log('Weve loaded enough, skipping');
      return
    }

    requestJSON({
      url: endpoint + '/poll/' + songPollId + '/breakdown',
      withCredentials: true
    }, function (err, result) {
      if(err) {
        return toasty(new Error(err));
      }
      var topSongEl = el.querySelector('[role=top-song]');

      var removeSong = function (skipTrack) {
        console.log('remove the song at');
        el.classList.toggle('no-top-song', true);
        topSongEl.innerHTML = '';
        artistsLoaded++; //This is used to track when we are done with all the functions

        if(rank <= artistsToShow) {
          tracksToLoad--; //Wait for one fewer's songs ajax callback, since we have an artist in top X with no top song
        }
        doneLoading();
      }
      var results = result.countsByIndex.map(function (votes, index) {
        votes = (votes * 1000) +  + Math.round(Math.random()*100); //TESTING
        return {
          songId: result.poll.choices[index],
          votes: votes
        }
      })
      .sort(function (a, b) {
        if(a.votes == b.votes) {
          return 0
        }
        return a.votes > b.votes ? -1 : 1;
      });

      var topSong = results[0];
      artistRows[artistIndex].topSongs = results;

      var songIds = results.map(function (r) {
        return r.songId;
      })

      artistsLoaded++;
      tracksLoaded++;

      var track = transformBestOf2017Results.trackAtlas[topSong.songId];
      if(!track) {
        console.warn('Could not find a track for ', artistRows[artistIndex].artist.name, 'top songs', artistRows[artistIndex].topSongs);
      }
      else {
        artistRows[artistIndex].track = track;
        track.votes = topSong ? topSong.votes : 0;
      }
      console.log('build track atlas');
      artistRows[artistIndex].trackAtlas = results.reduce(function (atlas, voteResult) {
        var track = transformBestOf2017Results.trackAtlas[voteResult.songId];
        if(track) {
          atlas[track._id] = track;
        }
        else {
          console.warn('Could not find track in atlas from voteResult', voteResult)
        }
        return atlas;
      }, {});


      //Those that were demoted last go around for not having a unique song might not be demoted this time around
      //  so we are unsetting this class for all artists
      //It might be readded again when we check for updates after all the loading is done
      el.classList.toggle('demoted', false);

      console.log('render artist row track @ index: ', artistIndex, artistRows[artistIndex].artist.name);
      console.log('artistRows[artistIndex].rank',artistRows[artistIndex].rank);
      renderArtistRowTrack(artistRows[artistIndex], track)


      //Remove buttons for non-top-X artists since they aren't visible
      if(rank > artistsToShow) {
        return removeSong();
      }

      if(!result.countsByIndex || result.countsByIndex.length == 0) {
        return removeSong();
      }

      if(topSong.votes == 0) {
        return removeSong()
      }

      doneLoading();
    });
  });
}
updateBestOf2017Results.artistRows = [];

//Moves an artist row all way to the bottom and moves all those that were below it back up
//This is done when an artist is in the top 30 but all of their songs are already ranking above them
//  with other artists
function demoteArtistRow (demoteeRow) {
  var currentRank = demoteeRow.rank;
  demoteeRow.el.classList.toggle('demoted', true);
  demoteeRow.rank = updateBestOf2017Results.artistRows.length
  updateArtistRowElRank(demoteeRow.el, demoteeRow.rank);

  updateBestOf2017Results.artistRows.forEach(function (ar, index) {
    if(ar.rank >= currentRank) {
      ar.rank = ar.rank - 1;
      updateBestOf2017Results.artistRows[index] = ar;
      updateArtistRowElRank(ar.el, ar.rank);
      if(ar.trackAtlas && ar.topSongs) {
        var track = ar.trackAtlas[ar.topSongs[0].songId];
        renderArtistRowTrack(ar.el, track);
      }
    }
  })
}

function renderArtistRowTrack (artistRow, track) {
  var el = artistRow.el;
  if(!el) {
    console.warn('No el for this artistRow', artistRow)
    return
  }
  var topSongEl = el.querySelector('[role=top-song]')
  el.classList.toggle('no-top-song', false);
  track.streamable = true;
  track.releaseId = track.albums[0].releaseId
  el.classList.toggle('no-top-song', false);
  var votes = track.votes + ' vote' + (track.votes == 1 ? '': 's');
  //track.votes = votes;
  track.hasGold = hasGoldAccess();
  render(topSongEl, getTemplate('bestof2017-topsong'), track);
  if(artistRow.rank < artistsToShow) {
    updateArtistRowReleaseArt(artistRow.artist._id, track);
  }
}

var artistPollChoices = [];
function transformBestOf2017 (obj, done) {
  obj = obj || {}
  obj.hasVoted = false;
  obj.isSignedIn = isSignedIn();
  obj.artistBlocks = [];
  for(var i = 0; i < 10; i++) {
    obj.artistBlocks.push(i);
  }
  requestJSON({
    url: endpoint + '/poll/' + artistPollId + '/breakdown',
    withCredentials: true
  }, function (err, breakdown) {
    var poll = breakdown.poll;
    var ids = poll.choices.join(',');
    artistPollChoices = poll.choices;
    obj.status = breakdown.status;
    requestJSON({
      url: endpoint + '/catalog/artists-by-users?ids=' + ids,
      withCredentials: true
    }, function (err, result) {
      transformBestOf2017.artists = result.results.sort(function (a, b) {
        aname = a.name.toUpperCase();
        bname = b.name.toUpperCase();
        if (aname == bname){
          return 0
        }

        return aname < bname ? -1 : 1
      })
      transformBestOf2017.artistAtlas = {}
      transformBestOf2017.artists = transformBestOf2017.artists.map(function (artist) {
        artist.pollId = artistSongPolls[artist._id];
        transformBestOf2017.artistAtlas[artist._id] = artist;
        return artist
      })
      obj.artistOptions = [{_id: "-1", name: 'select an artist'}].concat(transformBestOf2017.artists);
      obj.votedForTweet = getVotedForTweet(transformBestOf2017.artistAtlas, breakdown);
      obj.tweetIntentURL = getVotedForTweetIntentUrl(obj.votedForTweet);
      obj.viewResultsLink = true;
      obj.votingCloseTime = formatBestOf2017EndTime(poll.end)
      done(null, obj);
    });
  });
}

function formatBestOf2017EndTime (date) {
  var parts = formatDateJSON(date);
  return parts.weekday + ' at ' + parts.hours + ':' + parts.minutes;
}


function getArtistDetails (vanityUri, done) {
  if(getArtistDetails.atlas[vanityUri]) {
    return done(null, getArtistDetails.atlas[vanityUri])
  }

  if(vanityUri === undefined) {
    return done('No vanityUri');
  }

  requestJSON({
    url: endpoint + '/catalog/artist/' + vanityUri
  }, function (err, artist) {
    if(err) {
      return done(err);
    }

    getArtistDetails.atlas[vanityUri] = artist;
    return done(null, getArtistDetails.atlas[vanityUri])
  })
}
getArtistDetails.atlas = {}

function changeBestOf2017Song (e) {
  var artistId = this.getAttribute('artist-id');
  var songs = transformBestOf2017.artistAtlas[artistId].tracks;
  var song = songs[this.value];
  updateArtistRowReleaseArt(artistId, song);
}

function updateArtistRowReleaseArt (artistId, song) {
  var releaseIds = song.albums.map(function (alb) {
    return alb.albumId;
  });
  requestJSON({
    url: endpoint + '/catalog/release?ids=' + releaseIds.join(',') + '&sortOn=releaseDate&sortValue=1&limit=1'
  }, function (err, result) {
    if(err) {
      return console.error(err);
    }

    //Here we are loading up the album art of the first release that this song appeared on
    var album = result.results[0];
    var artistRowEl = document.querySelector('.artist-row[artist-id="' + artistId + '"]');
    var banner = artistRowEl.querySelector('.banner');
    var img = new Image();
    img.onload = function () {
      banner.style.backgroundImage = 'url("' + img.src + '")';
      banner.classList.toggle('on', true);
      artistRowEl.classList.toggle('empty', false);
    }
    img.src = album.coverUrl + '?image_width=1024';
  });
}

function completedBestOf2017 () {
  var artistSelects = document.querySelectorAll('select[role=bestof2017-artist]')
  artistSelects.forEach(function (el, index) {
    el.addEventListener('change', function (e) {
      if(!isSignedIn()) {
        go('/sign-in?redirect=bestof2017')
        toasty('Log in or sign up to vote on Best of 2017');
        return
      }
      var artistId = el.value
      var artistRowEl = document.querySelector('.artist-row-' + index);
      var songArtistNameEl = document.querySelector('.artist-row-' + index + ' span[role=artist-name]')
      var artistNameEl = document.querySelector('.artist-row-' + index + ' h3[role=artist-name]')
      var songEl = document.querySelector('.artist-row-' + index + ' select[role=song-poll]')
      var bannerEl = artistRowEl.querySelector('.banner')

      if(artistId && artistId != "-1") {
        artistRowEl.setAttribute('artist-id', artistId);
        var data = getBestOf2017FormData();
        var otherSelectedArtists = data.artist.reduce(function (list, id, i) {
          if(index != i) {
            list.push(id);
          }
          return list
        }, []);

        if(otherSelectedArtists.indexOf(artistId) >= 0) {
          toasty(new Error("Cannot select the same artist twice"));
          el.value = "-1"
          var event = document.createEvent("HTMLEvents");
          event.initEvent("change",true,false);
          el.dispatchEvent(event);
          return false
        }

        var artist = transformBestOf2017.artistAtlas[artistId];
        songArtistNameEl.innerHTML = artist.name;
        artistNameEl.innerHTML = artist.name;
        songEl.innerHTML = '<option>loading...</option>';
        songEl.setAttribute('artist-id', artistId);

        getArtistDetails(artist.vanityUri, function (err, details) {
          if(err) {
            bannerEl.classList.toggle('on', false);
            bannerEl.style.backgroundImage = '';
            artistRowEl.classList.toggle('empty', false);
            return
          }
        });
      }
      else {
        songArtistNameEl.innerHTML = '';
        artistNameEl.innerHTML = 'Select an Artist';
        artistRowEl.removeAttribute('artist-id');
        artistRowEl.classList.toggle('empty', true);
        songEl.innerHTML = '';
        songEl.disabled = true;
        bannerEl.style.backgroundImage = '';
        return
      }

      var songPollId = artistSongPolls[artistId];
      requestJSON({
        url: endpoint + '/poll/' + songPollId
      }, function (err, poll) {
        if(err) {
          return toasty(new Error(err))
        }
        var trackIds = poll.choices
        transformBestOf2017.artistAtlas[artistId].pollChoices = poll.choices;//Need these preserved in the order in the poll since we vote using indexes
        requestJSON({
          url: endpoint + '/catalog/track?ids=' + trackIds.join(',')
        }, function (err, result) {
          if(err) {
            return toasty(new Error(err));
          }
          transformBestOf2017.artistAtlas[artistId].tracks = result.results.reduce(function (atlas, row) {
            atlas[row._id] = row;
            return atlas;
          }, {});
          songEl.removeEventListener('change', changeBestOf2017Song);
          songEl.addEventListener('change', changeBestOf2017Song);

          var options = result.results.sort(function (ta, tb) {
            if (ta.title == tb.title) {
              return 0
            }

            return ta.title > tb.title ? 1 : -1;
          }).map(function (track) {
            return '<option value="' + track._id + '">' + track.title + ' by ' + track.artistsTitle + '</option>'
          });

          if(options.length > 1) {
            songEl.innerHTML = '<option value=0>select a song</option>' + options;

          }
          else {
            songEl.innerHTML = options;
            changeBestOf2017Song.call(songEl);
          }

          songEl.disabled = false
        });
      });
    });
  });
  hookBestOfTweetButton();
}

function hookBestOfTweetButton () {
  var tweetText = document.querySelector('[name=tweet]');
  if(!tweetText) {
    return
  }
  var tweetButton = document.querySelector('a[role=tweet]');
  function updateTweetIntent () {
    var url = getVotedForTweetIntentUrl(tweetText.value);
    tweetButton.setAttribute('href', url);
  }
  tweetText.addEventListener('keyup', updateTweetIntent);
  updateTweetIntent();
}

function getBestOf2017FormData () {
  var form = document.querySelector('form[role=bestof2017]')
  var data = formToObject(form);
  return data
}

function clickSubmitBestOf2017 (e) {
  var data = getBestOf2017FormData();
  var dupe = false;
  var songVotes = {};
  var pollVotes = [];
  var missingSongVotes = [];
  var artistVotes = Object.keys(data.artist).reduce(function (list, index) {
    if(data.artist[index] && data.artist[index] != "-1") {
      var artistId = data.artist[index];

      //Check for a dupe and set dupe to true so we can use it for err messages
      if(list.indexOf(artistId) >= 0) {
        dupe = true;
        return []
      }
      else {
        //We vote with the index of the choice, so find this artist's id in the choices of the poll
        list.push(artistPollChoices.indexOf(artistId));
        var artist =  transformBestOf2017.artistAtlas[artistId];

        //Only add their song vote if they've picked something
        if(data.artistSongs[index] && data.artistSongs[index] != "0") {
          var songId = data.artistSongs[index];
          pollVotes.push({
            pollId: artist.pollId,
            choices: [artist.pollChoices.indexOf(songId)],
            type: 'song',
            artist: artist,
            song: artist.tracks[songId]
          });
        }
        else {
          missingSongVotes.push(artist.name);
        }
      }
    }
    return list
  }, []);

  if(missingSongVotes.length) {
    return toasty(new Error('Please select your favorite song' + (missingSongVotes.length == 1 ? '' : 's') + ' for ' + commaAnd(missingSongVotes) + '.'))
  }

  if (artistVotes.length == 0) {
    if(dupe) {
      toasty(new Error('You can only vote for each artist once'));
    }
    else {
      toasty(new Error('You need to select at least one artist'));
    }
    return
  }

  //This section is preventing you from voting for a song twice
  //This can happen when two artists work on the same song
  var songIdVotes = [];
  var songArtistVotes = [];
  var dupeSongs = false;
  pollVotes.forEach(function (pv) {
    var songId = pv.song._id;
    var index = songIdVotes.indexOf(songId);
    if(index >= 0) {
      toasty(new Error('Your vote for <em>' + pv.song.title + '</em> is already under ' + songArtistVotes[index]));
      dupeSongs = true;
    }
    else {
      songIdVotes.push(songId);
      songArtistVotes.push(pv.artist.name);
    }
  });

  if(dupeSongs) {
    //return
  }

  pollVotes.push({
    pollId: artistPollId,
    choices: artistVotes,
    type: 'artist'
  });

  var callbacks = 0;
  pollVotes.forEach(function (item) {
    requestJSON({
      url: endpoint + '/vote',
      method: 'POST',
      data: {
        pollId: item.pollId,
        choices: item.choices
      },
      withCredentials: true
    }, function (err, obj) {
      callbacks++
      if (err) return toasty(Error(err.message))
      else {
        //Last callback
        if(callbacks == pollVotes.length) {
          toasty('Voting successful!')
          go('/bestof2017')
        }
      }
    })
  });
}

function getVotedForTweetIntentUrl (tweet) {
  return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweet);
}

function getVotedForTweet (artistAtlas, breakdown) {
  if(breakdown.status.voted) {
    artists = breakdown.userVotes[0].choicesByValue.map(function (aid) {
      var artist = artistAtlas[aid];
      return artist
    });
  }
  else {
    return false
  }
  var tweet = 'My #mcatbestof2017 votes ' + artists.map(function (artist) {
    return getArtistTwitterMention(artist)
  }).join(' ') + '';

  var link = 'monster.cat/bestof2017';
  if(tweet.length + link.length < 141) {
    tweet += ' ' + link;
  }

  return tweet;
}

function clickCloseBestOf2017ThankYou () {
  setCookie('hideBestOf2017ThankYou', "true");
  var alert = document.querySelector('[role=thank-you-alert]');
  alert.classList.toggle('hide', true);
}