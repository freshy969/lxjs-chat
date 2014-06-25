var media = require('./media')
var Peer = require('./peer')
var Socket = require('./socket')

var socket = new Socket()
var peer
var stream

var $videoLocal = document.querySelector('video.local')
var $videoRemote = document.querySelector('video.remote')
var $next = document.querySelector('.next')
var $chat = document.querySelector('form.text')
var $send = document.querySelector('.send')
var $textInput = document.querySelector('.text input')
var $history = document.querySelector('.history')

socket.on('error', function (err) {
  console.error('socket error', err.stack || err.message || err)
})


socket.on('ready', function () {
  socket.send({ type: 'hello' })

  // TODO: ui changes

  media.getUserMedia(function (err, _stream) {
    if (err) {
      alert(err)
    } else {
      stream = _stream
      media.showStream($videoLocal, stream)
      next()
    }
  })
})

socket.on('peer', function (data) {
  data = data || {}

  if (peer) {
    peer.close()
  }

  peer = new Peer({
    initiator: !!data.initiator,
    stream: stream
  })

  peer.on('error', function (err) {
    console.error('peer error', err.stack || err.message || err)
  })
  peer.on('signal', function (data) {
    socket.send({ type: 'signal', data: data })
  })

  peer.on('chat', function (data) {
    addChat(data, false)
  })
  peer.on('stream', function (stream) {
    media.showStream($videoRemote, stream)
  })

  peer.on('ready', function () {
    // TODO: undisable the UI
  })
  peer.on('close', function () {
    // TODO: Disable the UI
  })

  // useful for debugging
  peer.on('icechange', function (iceGatheringState, iceConnectionState) {
    console.log('[icechange] ', iceGatheringState, iceConnectionState)
  })
  peer.on('statechange', function (signalingState, readyState) {
    console.log('[statechange] ', signalingState, readyState)
  })

})

socket.on('signal', function (data) {
  peer.signal(data)
})

socket.on('end', function (data) {
  next()
})


document.querySelector('.next').addEventListener('click', function (event) {
  event.preventDefault()
  if (peer) {
    socket.send({ type: 'end' })
  }
  next()
})

function next () {
  socket.send({ type: 'peer' })
}

$chat.addEventListener('submit', send)
$send.addEventListener('click', send)

function send (event) {
  event.preventDefault()
  var text = $textInput.value
  addChat(text, true)
  peer.send({ type: 'chat', data: text })
  $textInput.value = ''
}

function addChat (text, local) {
  var node = document.createElement('div')
  node.className = local ? 'local' : 'remote'
  node.textContent = text
  $history.appendChild(node)
}
