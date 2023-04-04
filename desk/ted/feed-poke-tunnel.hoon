/-  spider, *tome
/+  *strandio, tomelib
=,  strand=strand:spider
|%
++  decode-input
  =,  dejs:format
  |=  jon=json
  %.  jon
  %-  ot
  :~  ship+so  :: needs to have no sig
      json+so
  ==
--
^-  thread:spider
|=  arg=vase
=/  m  (strand ,vase)
^-  form:m
=/  jon=json
  (need !<((unit json) arg))
=/  input  (decode-input jon)
=/  ship  `@p`(slav %p -.input)
=/  act  (feed-action:dejs:tomelib (need (de-json:html +.input)))
::
::  This returns nothing on failure, 'success' on success.
;<  ~  bind:m  (poke [ship %tome] [%feed-action !>(act)])
(pure:m !>(s+'success'))