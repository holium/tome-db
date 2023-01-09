::
:: %rooms-v2: is a primitive for who is currently presence.
::
::
/-  spaces=spaces-path
|%
+$  rid         @t
+$  title       cord
+$  capacity    @ud
+$  access      ?(%public %private)
+$  present     (set ship)
+$  whitelist   (set ship)
+$  space-path  path:spaces

+$  room
  $:  =rid
      provider=ship
      creator=ship
      =access
      =title
      =present
      =whitelist
      capacity=@ud
      path=(unit cord)
  ==
::
+$  rooms  (map rid room)
::
+$  session-state
  $:  provider=ship
      current=(unit rid)
      =rooms
  ==
:: 
+$  provider-state
  $:  =rooms
      online=?
      banned=(set ship)
  ==
::
+$  edit-payload
  $%  [%title =title]
      [%access =access]
  ==
::
+$  session-action
  $%  [%set-provider =ship]       
      [%reset-provider ~]
      [%create-room =rid =access =title path=(unit cord)]
      [%edit-room =rid =title =access]
      [%delete-room =rid]
      [%enter-room =rid]
      [%leave-room =rid]
      [%invite =rid =ship]
      [%kick =rid =ship]
      [%send-chat content=cord]
  ==
::
+$  reaction
  $%  [%room-entered =rid =ship]
      [%room-left =rid =ship]
      [%room-created =room]
      [%room-updated =room]
      [%room-deleted =rid]
      [%provider-changed provider=ship =rooms]
      [%invited provider=ship =rid =title =ship]
      [%kicked =rid =ship] 
      [%chat-received from=ship content=cord] 
  ==
::
+$  provider-action
  $%  [%set-online online=?]
      [%ban =ship]
      [%unban =ship]
  ==
::
+$  signal-action
  $%  
      [%signal from=ship to=ship rid=cord data=cord]
  ==
::
+$  view
  $%  [%session =session-state]
      [%room =room]
      [%provider =ship]
  ==
::
--
