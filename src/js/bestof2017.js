var artistsToShow = 30;
var artistPollId = "59c58a287339c674c2c54859";
var artistSongPolls = {
"566f6a19a6ecb2f012a7a7ea": "59c58a287339c674c2c5485e",
"58dd476e31889b5549ae6cf8": "59c58a287339c674c2c54863",
"58a2a1d7b162ce110bacf139": "59c58a287339c674c2c54868",
"57c9f980c624dddb7506aae4": "59c58a287339c674c2c5486d",
"50351436b9a8864686001a74": "59c58a287339c674c2c54872",
"5706dd3785ff0545443020f3": "59c58a287339c674c2c54877",
"517569600695c7ac5d000019": "59c58a287339c674c2c5485a",
"5874b9dcf3e22ce8111c3f4b": "59c58a287339c674c2c5485f",
"58d97944cdaed00e15c35a5d": "59c58a287339c674c2c54864",
"588f96731d91ca8008b6b09e": "59c58a287339c674c2c54869",
"58d403a78eb9a1761ab32ab0": "59c58a287339c674c2c5486e",
"58f8f86cc181ba4acc3d5636": "59c58a287339c674c2c54873",
"58fd19faae1feb7fbc33174b": "59c58a287339c674c2c54878",
"59384d32cce408478c166aa4": "59c58a287339c674c2c5487d",
"5342ec9a23570dcd0a000043": "59c58a287339c674c2c54882",
"50351437b9a8864686001fa0": "59c58a287339c674c2c54887",
"571e7599d289e5fd7bc480a3": "59c58a287339c674c2c5488c",
"57e57c87f6cc115b2a8613b0": "59c58a287339c674c2c54891",
"55a6fe0c088f908270475b6e": "59c58a287339c674c2c5485c",
"508708559022a172fa000006": "59c58a287339c674c2c54861",
"50351436b9a886468600133a": "59c58a287339c674c2c54866",
"5819299612ccd83635090e79": "59c58a287339c674c2c5486b",
"5874b77a62bd71db11afbee8": "59c58a287339c674c2c54870",
"52f8289758f837743500003f": "59c58a287339c674c2c54875",
"50351434b9a88646860007d3": "59c58a287339c674c2c5487a",
"58eaab2cae1feb7fbc32c92d": "59c58a287339c674c2c5487f",
"555b7ef978b1b22d215af009": "59c58a287339c674c2c54884",
"559ac2d986921b8e0bcaf15d": "59c58a287339c674c2c54889",
"58e68d2a70b57006b24b04f7": "59c58a287339c674c2c5488e",
"58dd46ed31889b5549ae6cf2": "59c58a287339c674c2c5485d",
"57e2f4d9f6cc115b2a8492b6": "59c58a287339c674c2c54862",
"525f0f6ada3a6b6911000017": "59c58a287339c674c2c54867",
"58d84763dd6cce1127a053e3": "59c58a287339c674c2c5486c",
"50351436b9a8864686001a31": "59c58a287339c674c2c54871",
"50351437b9a8864686001be1": "59c58a287339c674c2c54876",
"55b9475bb8831d817361d41b": "59c58a287339c674c2c5487b",
"57e57d51f6cc115b2a8614c5": "59c58a287339c674c2c54880",
"57c71f05c624dddb750515b4": "59c58a287339c674c2c54885",
"577d8aaf6765bfaf2cddb83f": "59c58a287339c674c2c5488a",
"591375e50ba8745b1751375e": "59c58a287339c674c2c5488f",
"535540f7e4360f642100009b": "59c58a287339c674c2c5485b",
"57e57ef7f6cc115b2a86179b": "59c58a287339c674c2c54860",
"582e2c014031b36f516c64d9": "59c58a287339c674c2c54865",
"56315eb2c96bc968152e2dd0": "59c58a287339c674c2c5486a",
"50b5af77b9a8863f26000001": "59c58a287339c674c2c5486f",
"57e57cc5f6cc115b2a86140a": "59c58a287339c674c2c54874",
"54aae5fb5f5da4ef149955e5": "59c58a287339c674c2c54879",
"512bdcd4b9a8860a1100002c": "59c58a287339c674c2c5487e",
"582e2bcd4031b36f516c64c4": "59c58a287339c674c2c54883",
"53585bd0e4360f6421000112": "59c58a287339c674c2c54888",
"53867649689633ae2700003d": "59c58a287339c674c2c5488d",
"568da84d451c59462c03737e": "59c58a287339c674c2c5487c",
"58a6d69d48ddea197e735020": "59c58a287339c674c2c54881",
"588f90128ef6e389086820af": "59c58a287339c674c2c54886",
"568da4fc451c59462c037379": "59c58a287339c674c2c5488b",
"52eecb9a8113d0cc28000021": "59c58a287339c674c2c54890",
};

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

    //Map results to the choices in the poll
    var voteResults = breakdown.countsByIndex.map(function (votes, index) {
      return {
        artistId: obj.poll.choices[index],
        votes: votes
      }
    });

    var artistIds = voteResults.map(function (result) {
      return result.artistId
    })

    var artistAtlas = {};
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
      obj.results = voteResults.map(function (result) {
        result.artist = atlas[result.artistId];
        return result
      });
      obj.status = breakdown.status;
      obj.showThankYou = getCookie('hideBestOf2017ThankYou') != 'true' && breakdown.status.voted;
      obj.votedForTweet = getVotedForTweet(atlas, breakdown);
      obj.tweetIntentURL = getVotedForTweetIntentUrl(obj.votedForTweet)
      done(null, obj);
    });
  });
}

function completedBestOf2017Results () {
  updateBestOf2017Results.lastUpdated = new Date().getTime();
  var timeout = null;
  var updateResults = function () {
    updateBestOf2017Results();
    clearTimeout(timeout);
    timeout = setTimeout(updateResults, 30000);
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
      votes = votes * 10; //ANything I vote for is first
      if(index <= artistsToShow) {
        votes += Math.floor(Math.random() * 5)
      }
      return {
        artistId: result.poll.choices[index],
        votes: votes
      }
    })
    .sort(function (a, b) {
      if (a.votes == b.votes) return 0
      return a.votes > b.votes ? -1 : 1;
    })
    .map(function (result, index) {
      result.rank = index+1
      return result
    });

    //Update vote and rank text and CSS classes
    results.forEach(function (result, index) {
      var rank = result.rank;
      var el = document.querySelector('.bestof2017-result[artist-id="' + result.artistId + '"]');
      var cls = el.getAttribute('class');
      var rank = index + 1;
      cls = cls.replace(/rank-[0-9]+/, '')
      cls += ' rank-' + rank;
      el.setAttribute('class', cls);
      el.setAttribute('rank', rank);
      el.classList.toggle('top', rank <= artistsToShow);

      var votesEl = el.querySelector('[role=votes]');
      votesEl.innerHTML = result.votes + ' vote' + (result.votes == 1 ? '' : 's');

      var rankEl = el.querySelector('[role=rank]');
      rankEl.innerHTML = result.rank
    });

    updateBestOf2017SongResults();
    updateBestOf2017Results.lastUpdated = new Date().getTime();
  });
}

/**
 * Updates the top song of each of the top X artists on the page
 *
 */
function updateBestOf2017SongResults () {
  //We need to convert this to an array of objects so we can sort it
  //as the querySelectorAll returns an array that cannot be sorted
  var artistEls = document.querySelectorAll('.artist-row');
  artistRows = []
  artistEls.forEach(function (el) {
    artistRows.push({
      rank: parseInt(el.getAttribute('rank')),
      el: el
    });
  });

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
        playButton.setAttribute('index', trackIndex);
        trackIndex++;
      }
    });


    if(tracksLoaded == tracksToLoad) {
      //We need to clear out the player and rebuild its list of items
      //so that when it hits the end it plays the NEW next song
      //If you play song #5 and it moves to #3 before it's done
      //the next song to autoplay should be #4

      //Grab the tracks from the dom. Some new ones may have been added
      //These are sorted by the [index] property on the button
      var tracks = buildTracks();

      tracks = tracks.map(function (track) {
        track.skip = false; //skip will hide unlicensable tracks from licensees
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

  var tracksLoaded = 0;
  var tracksToLoad = artistsToShow;
  var artistsLoaded = 0;
  var trackIndex = -1;
  var skippedTracks = 0;
  artistRows.forEach(function (ar, artistIndex) {
    var el = ar.el;
    var rank = ar.rank;
    var artistId = el.getAttribute('artist-id');
    var songPollId = artistSongPolls[artistId];
    requestJSON({
      url: endpoint + '/poll/' + songPollId + '/breakdown',
      withCredentials: true
    }, function (err, result) {
      if(err) {
        return toasty(new Error(err));
      }
      var topSongEl = el.querySelector('[role=top-song]');

      var removeSong = function (skipTrack) {
        el.classList.toggle('no-top-song', true);
        topSongEl.innerHTML = '';
        artistsLoaded++; //This is used to track when we are done with all the functions
        skippedTracks++;

        if(rank <= artistsToShow) {
          tracksToLoad--; //Wait for one fewer's songs ajax callback, since we have an artist in top X with no top song
        }
        doneLoading();
      }

      //Remove buttons for non-top-X artists since they aren't visible
      if(rank > artistsToShow) {
        return removeSong();
      }

      if(!result.countsByIndex || result.countsByIndex.length == 0) {
        return removeSong();
      }

      var results = result.countsByIndex.map(function (votes, index) {
        votes += Math.floor(Math.random() * 5)
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

      if(topSong.votes == 0) {
        return removeSong()
      }

      requestJSON({
        url: endpoint + '/catalog/track/' + topSong.songId,
        withCredentials: true
      }, function (err, result) {
        if(err) {
          removeSong();
          return toasty(new Error(err));
        }

        transformTracks({results: [result]}, function (err, results) {
          if(err) {
            toasty(new Error(err));
            removeSong();
            return
          }
          el.classList.toggle('no-top-song', false);
          tracksLoaded++;
          artistsLoaded++;
          trackIndex++;

          var track = results.results[0];
          artistRows[artistIndex].track = track;
          track.streamable = true;
          track.releaseId = track.albums[0].releaseId
          el.classList.toggle('no-top-song', false);
          var votes = topSong.votes + ' vote' + (topSong.votes == 1 ? '': 's');
          track.votes = votes;
          render(topSongEl,'<h4>Top Song <span class="votes">{{votes}}</span></h4><div class="top-song">{{>playSong}} <span class="top-song-name">{{title}} by {{artistsTitle}}</span></div>', track);
          doneLoading();
        });
      })
    });
  });
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
      done(null, obj);
    });
  });
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

function completedBestOf2017 () {
  var artistSelects = document.querySelectorAll('select[role=bestof2017-artist]')
  artistSelects.forEach(function (el, index) {
    el.addEventListener('change', function (e) {
      var artistId = el.value
      var artistRowEl = document.querySelector('.artist-row-' + index)
      var songArtistNameEl = document.querySelector('.artist-row-' + index + ' span[role=artist-name]')
      var artistNameEl = document.querySelector('.artist-row-' + index + ' h3[role=artist-name]')
      var songEl = document.querySelector('.artist-row-' + index + ' select[role=song-poll]')
      var bannerEl = artistRowEl.querySelector('.banner')

      if(artistId && artistId != "-1") {
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
        artistRowEl.classList.toggle('empty', false);
        songEl.innerHTML = '<option>loading...</option>';

        getArtistDetails(artist.vanityUri, function (err, details) {
          if(err) {
            bannerEl.classList.toggle('on', false);
            bannerEl.style.backgroundImage = '';
            return
          }
          bannerEl.style.backgroundImage = 'url(' + details.profileImageUrl + '?image_width=1024)';
          bannerEl.style.backgroundPosition = 'center ' + details.imagePositionY + '%';
          bannerEl.classList.toggle('on', true);
        });
      }
      else {
        songArtistNameEl.innerHTML = '';
        artistNameEl.innerHTML = 'Select an Artist';
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
          var options = result.results.sort(function (ta, tb) {
            if (ta.title == tb.title) {
              return 0
            }

            return ta.title > tb.title ? 1 : -1;
          }).map(function (track) {
            return '<option value="' + track._id + '">' + track.title + ' by ' + track.artistsTitle + '</option>'
          });

          songEl.innerHTML = '<option value=0>select a song</option>' + options;
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

        //Only add their song vote if they've picked something
        if(data.artistSongs[index] && data.artistSongs[index] != "0") {
          var artist =  transformBestOf2017.artistAtlas[artistId];
          pollVotes.push({
            pollId: artist.pollId,
            choices: [artist.pollChoices.indexOf(data.artistSongs[index])]
          });
        }
      }
    }
    return list
  }, []);

  if (artistVotes.length == 0) {
    if(dupe) {
      toasty(new Error('You can only vote for each artist once'));
    }
    else {
      toasty(new Error('You need to select at least one artist'));
    }
    return
  }

  pollVotes.push({
    pollId: artistPollId,
    choices: artistVotes
  })

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