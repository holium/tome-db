/-  s-p=spaces-path, s-s=spaces-store
/-  m-s=membership, v-s=visas
::
|%
+$  spat         (pair ship cord)
+$  space        space:s-s
+$  stype        type:s-s
+$  spaces       spaces:s-s
+$  member       member:m-s
+$  members      members:m-s
+$  invitations  invitations:v-s
::
++  realms
  |_  $:  dish=bowl:gall
          inis=(set ship)
          mems=(set ship)
          adms=(set ship)
          owns=(set ship)
          pend=(set ship)
          hust=(unit ship)
          sput=(unit spat)
          spuc=(unit space)
          spaz=spaces
      ==
  +*  re  .
      pat  /(scot %p our.dish)/spaces/(scot %da now.dish)
  ++  re-abet-saz  `spaces`spaz                         ::  get spaces per query
  ++  re-abet-pen  `(set ship)`pend                     ::  get pending members
  ++  re-abet-ini  `(set ship)`inis                     ::  get initiates
  ++  re-abet-mem  `(set ship)`mems                     ::  get members
  ++  re-abet-adm  `(set ship)`adms                     ::  get administrators
  ++  re-abet-own  `(set ship)`owns                     ::  get owners
  ++  re-abet-hos  `ship`(need hust)                    ::  get host
  ++  re-abet-sap  `spat`(need sput)                    ::  get space-path
  ++  re-abet-det  `space`(need spuc)                   ::  get space details
  ++  all
    ^-  spaces
    =-  ?>(?=([%spaces *] -) +.-)
    .^(view:s-s %gx (welp pat /all/noun))
  ++  inv
    ^-  invitations
    =-  ?>(?=([%invitations *] -) +.-)
    .^(view:v-s %gx (welp pat /invitations/noun))
  ++  mem
    =+  spa=(need sput)
    ^-  members
    =-  ?>(?=([%members *] -) +.-)
    .^  view:m-s
      %gx
      (welp pat /(scot %p p.spa)/[q.spa]/members/noun)
    ==
  ++  re-read
    ^+  re
    =-  re(spaz -)
    %-  ~(rep by all)
    |=  [sap=(pair spat space) suz=spaces]
    ?.(=((need hust) p.p.sap) suz (~(put by suz) sap))
  ++  re-abed
    |=  [bol=bowl:gall and=(each (pair ship cord) (unit ship))]
    ^+  re
    =.  dish  bol
    ?:  ?=(%.y -.and)
      re-team:re-read(sput `p.and, hust `p.p.and)
    ?~(p.and re(spaz all) re-read(hust p.and))
  ++  re-team
    ^+  re
    =;  [i=(set @p) m=(set @p) a=(set @p) o=(set @p) p=(set @p)]
      re(inis i, mems m, adms a, owns o, pend p)
    %-  ~(rep by mem)
    |=  $:  [s=ship m=member]
            $=  o
            $:  i=(set @p)
                m=(set @p)
                a=(set @p)
                o=(set @p)
                p=(set @p)
            ==
        ==
    ?:  =(%invited status.m)  [i.o m.o a.o o.o (~(put in p.o) s)]
    =:  i.o  ?.((~(has in roles.m) %initiate) i.o (~(put in i.o) s))
        m.o  ?.((~(has in roles.m) %member) m.o (~(put in m.o) s))
        a.o  ?.((~(has in roles.m) %admin) a.o (~(put in a.o) s))
        o.o  ?.((~(has in roles.m) %owner) o.o (~(put in o.o) s))
      ==
    [i.o m.o a.o o.o p.o]
  --
--
