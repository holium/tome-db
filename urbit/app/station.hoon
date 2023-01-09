::  a space agent skeleton
/-  *station
/+  r-l=realm-lib
/+  verb, dbug, defa=default-agent
::
|%
::
+$  versioned-state  $%(state-0)
::
+$  state-0  [%0 ~]
::
::
::  boilerplate
::
+$  card  card:agent:gall
--
::
%+  verb  &
%-  agent:dbug
=|  state-0
=*  state  -
::
^-  agent:gall
::
=<
  |_  =bowl:gall
  +*  this  .
      def  ~(. (defa this %|) bowl)
      eng   ~(. +> [bowl ~])
  ++  on-init
    ^-  (quip card _this)
    ~>  %bout.[0 '%station +on-init']
    =^  cards  state
      abet:init:eng
    [cards this]
  ::
  ++  on-save
    ^-  vase
    ~>  %bout.[0 '%station +on-save']
    !>(state)
  ::
  ++  on-load
    |=  ole=vase
    ~>  %bout.[0 '%station +on-load']
    ^-  (quip card _this)
    =^  cards  state
      abet:(load:eng ole)
    [cards this]
  ::
  ++  on-poke
    |=  cag=cage
    ~>  %bout.[0 '%station +on-poke']
    ^-  (quip card _this)
    =^  cards  state  abet:(poke:eng cag)
    [cards this]
  ::
  ++  on-peek
    |=  =path
    ~>  %bout.[0 '%station +on-peek']
    ^-  (unit (unit cage))
    [~ ~]
  ::
  ++  on-agent
    |=  [wir=wire sig=sign:agent:gall]
    ~>  %bout.[0 '%station +on-agent']
    ^-  (quip card _this)
    `this
  ::
  ++  on-arvo
    |=  [wir=wire sig=sign-arvo]
    ~>  %bout.[0 '%station +on-arvo']
    ^-  (quip card _this)
    `this
  ::
  ++  on-watch
  |=  =path
  ~>  %bout.[0 '%station +on-watch']
  ^-  (quip card _this)
  `this
  ::
  ++  on-fail
    ~>  %bout.[0 '%station +on-fail']
    on-fail:def
  ::
  ++  on-leave
    ~>  %bout.[0 '%station +on-init']
    on-leave:def
  --
|_  [bol=bowl:gall dek=(list card)]
+*  dat  .
++  emit  |=(=card dat(dek [card dek]))
++  emil  |=(lac=(list card) dat(dek (welp lac dek)))
++  abet
  ^-  (quip card _state)
  [(flop dek) state]
::
++  init
  ^+  dat
  dat
::
++  load
  |=  vaz=vase
  ^+  dat
  ?>  ?=([%0 *] q.vaz)
  dat(state !<(state-0 vaz))
++  poke
  |=  [mar=mark vaz=vase]
  ?>  =(%noun mar)
  =+  act=!<(action vaz)
  ?-  -.act
      %all
    ~&  >>>
      ^-  spaces:r-l
      re-abet-saz:(re-abed:realms:r-l bol [%| ~])
    dat
  ::
      %host  
    ~&  >>
      ^-  spaces:r-l
      re-abet-saz:(re-abed:realms:r-l bol [%| `who.act])
    dat
  ::
      %space
    =+  rel=(re-abed:realms:r-l bol [%& sap.act])
    ?-    wat.act
        %spaces
      ~&  >  `spaces:r-l`re-abet-saz:rel  dat
        %detail
      ~&  >  `space:r-l`re-abet-det:rel  dat
        %host
      ~&  >  `ship`re-abet-hos:rel  dat
        %owners
      ~&  >  `(set ship)`re-abet-own:rel  dat
        %pending
      ~&  >  `(set ship)`re-abet-pen:rel  dat
        %initiates
      ~&  >  `(set ship)`re-abet-ini:rel  dat
        %members
      ~&  >  `(set ship)`re-abet-mem:rel  dat
        %administrators
      ~&  >  `(set ship)`re-abet-adm:rel  dat
    ==
  ==
--